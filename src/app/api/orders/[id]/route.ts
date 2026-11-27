export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getD1OrderDetail, CloudflareD1Binding } from '@/lib/d1';
import { resolveD1Binding } from '@/lib/d1-remote';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { notifySlipUploadedToLine } from '@/lib/line';
import { getAdminSession } from '@/lib/auth';
import { hasOrderAccess } from '@/lib/order-token';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

const VALID_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SLIP_UPLOADED',
  'PREPARING',
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
] as const;

type ValidStatus = typeof VALID_STATUSES[number];

// GET /api/orders/[id] - order details
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;

    if (!(await hasOrderAccess(req, id))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check Cloudflare D1 binding & runtime env on Edge Runtime or Localhost Remote Bridge
    let d1Binding: CloudflareD1Binding | undefined = resolveD1Binding();
    let runtimeEnv: any;
    try {
      runtimeEnv = getRequestContext()?.env;
      d1Binding = runtimeEnv?.DB || d1Binding;
    } catch {}

    if (d1Binding) {
      const order = await getD1OrderDetail(id, d1Binding);
      if (!order) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลคำสั่งซื้อ' },
          { status: 404 }
        );
      }
      return NextResponse.json(order);
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
        ],
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลคำสั่งซื้อ' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - update order status with atomic restock on cancellation
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  return handleUpdateOrder(req, params.id);
}

// PUT /api/orders/[id] - alternative method
export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  return handleUpdateOrder(req, params.id);
}

async function handleUpdateOrder(req: NextRequest, id: string) {
  try {
    if (!(await hasOrderAccess(req, id))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const newStatus = body.status as ValidStatus | undefined;
    const note = body.note;
    const slipUrl = body.slipUrl;
    const paymentMethod = body.paymentMethod;

    const trimmedSlipUrl =
      slipUrl !== undefined && slipUrl !== null ? String(slipUrl).trim() : undefined;
    const hasSlipSubmission = Boolean(trimmedSlipUrl);

    if (hasSlipSubmission && !trimmedSlipUrl!.startsWith('/uploads/')) {
      return NextResponse.json(
        { error: 'URL สลิปไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (
      (body.address !== undefined && String(body.address).trim().length > 500) ||
      (note !== undefined && note !== null && String(note).trim().length > 500)
    ) {
      return NextResponse.json(
        { error: 'ข้อมูลที่กรอกมีความยาวเกินกำหนด' },
        { status: 400 }
      );
    }

    // Only authenticated admins can change order status or paymentMethod directly
    if (newStatus !== undefined || paymentMethod !== undefined) {
      const session = await getAdminSession();
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    if (newStatus && !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: 'สถานะคำสั่งซื้อไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Check Cloudflare D1 binding & runtime env on Edge Runtime or Localhost Remote Bridge
    let d1Binding: CloudflareD1Binding | undefined = resolveD1Binding();
    let runtimeEnv: any;
    try {
      runtimeEnv = getRequestContext()?.env;
      d1Binding = runtimeEnv?.DB || d1Binding;
    } catch {}

    if (d1Binding) {
      // Find the target order
      const existingOrder = (await d1Binding
        .prepare(`
          SELECT id, orderNumber, customerId, status
          FROM [Order]
          WHERE id = ? OR orderNumber = ?
          LIMIT 1
        `)
        .bind(id, id)
        .first()) as any;

      if (!existingOrder) {
        return NextResponse.json(
          { error: 'ไม่พบคำสั่งซื้อที่ต้องการอัปเดต' },
          { status: 404 }
        );
      }

      if (hasSlipSubmission && existingOrder.status !== 'CONFIRMED') {
        return NextResponse.json(
          { error: 'กรุณารอร้านยืนยันคำสั่งซื้อก่อนแนบสลิปการโอนเงิน' },
          { status: 403 }
        );
      }

      const oldStatus = existingOrder.status;
      const targetStatus: ValidStatus | undefined = hasSlipSubmission
        ? 'SLIP_UPLOADED'
        : newStatus;

      // 1. If transitioning to CANCELLED from an active status: RESTOCK
      if (targetStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        const { results: items } = await d1Binding
          .prepare(`SELECT productId, quantity FROM OrderItem WHERE orderId = ?`)
          .bind(existingOrder.id)
          .all();

        for (const item of (items || [])) {
          if ((item as any).productId) {
            await d1Binding
              .prepare(`UPDATE Product SET stock = stock + ?, sold = sold - ? WHERE id = ?`)
              .bind((item as any).quantity, (item as any).quantity, (item as any).productId)
              .run();
          }
        }
      }

      // 2. If un-cancelling (from CANCELLED to an active status): VERIFY & RE-DEDUCT
      if (oldStatus === 'CANCELLED' && targetStatus && targetStatus !== 'CANCELLED') {
        const { results: items } = await d1Binding
          .prepare(`SELECT productId, productName, quantity FROM OrderItem WHERE orderId = ?`)
          .bind(existingOrder.id)
          .all();

        for (const item of (items || [])) {
          if ((item as any).productId) {
            const product = (await d1Binding
              .prepare(`SELECT stock, name FROM Product WHERE id = ? LIMIT 1`)
              .bind((item as any).productId)
              .first()) as any;
            if (!product || Number(product.stock) < (item as any).quantity) {
              throw new Error(
                `สินค้า "${(item as any).productName}" มีสต็อกไม่เพียงพอสำหรับการคืนสถานะออเดอร์`
              );
            }
          }
        }

        for (const item of (items || [])) {
          if ((item as any).productId) {
            await d1Binding
              .prepare(`UPDATE Product SET stock = stock - ?, sold = sold + ? WHERE id = ?`)
              .bind((item as any).quantity, (item as any).quantity, (item as any).productId)
              .run();
          }
        }
      }

      // 3. Update customer address if provided (allowed only while status is PENDING)
      if (body.address !== undefined) {
        if (existingOrder.status !== 'PENDING') {
          throw new Error('ไม่สามารถแก้ไขที่อยู่จัดส่งได้ เนื่องจากร้านค้ายืนยันออเดอร์แล้ว');
        }
        await d1Binding
          .prepare(`UPDATE Customer SET address = ? WHERE id = ?`)
          .bind(String(body.address).trim(), existingOrder.customerId)
          .run();
      }

      // 4. Update order record
      const updates: string[] = [];
      const updateParams: any[] = [];

      if (targetStatus) {
        updates.push('status = ?');
        updateParams.push(targetStatus);
      }
      if (note !== undefined) {
        if (existingOrder.status !== 'PENDING' && !targetStatus) {
          throw new Error('ไม่สามารถแก้ไขหมายเหตุได้ เนื่องจากร้านค้ายืนยันออเดอร์แล้ว');
        }
        updates.push('note = ?');
        updateParams.push(note ? String(note).trim() : null);
      }
      if (slipUrl !== undefined) {
        updates.push('slipUrl = ?');
        updateParams.push(trimmedSlipUrl || null);
      }
      if (paymentMethod !== undefined && ['TRANSFER', 'COD'].includes(paymentMethod)) {
        updates.push('paymentMethod = ?');
        updateParams.push(paymentMethod);
      }

      if (updates.length > 0) {
        updates.push('updatedAt = ?');
        updateParams.push(new Date().toISOString());
        updateParams.push(existingOrder.id);

        await d1Binding
          .prepare(`UPDATE [Order] SET ${updates.join(', ')} WHERE id = ?`)
          .bind(...updateParams)
          .run();
      }

      const updated = await getD1OrderDetail(existingOrder.id, d1Binding);
      if (updated && hasSlipSubmission) {
        await notifySlipUploadedToLine(updated, runtimeEnv);
      }
      return NextResponse.json(updated);
    }

    // Find the target order
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { id },
          { orderNumber: id },
        ],
      },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'ไม่พบคำสั่งซื้อที่ต้องการอัปเดต' },
        { status: 404 }
      );
    }

    if (hasSlipSubmission && existingOrder.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'กรุณารอร้านยืนยันคำสั่งซื้อก่อนแนบสลิปการโอนเงิน' },
        { status: 403 }
      );
    }

    const oldStatus = existingOrder.status;
    const targetStatus: ValidStatus | undefined = hasSlipSubmission
      ? 'SLIP_UPLOADED'
      : newStatus;

    // Execute atomic transaction for status update and stock restock/adjust
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. If transitioning to CANCELLED from an active status: RESTOCK
      if (targetStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        for (const item of existingOrder.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                sold: { decrement: item.quantity },
              },
            });
          }
        }
      }

      // 2. If un-cancelling (from CANCELLED to an active status): VERIFY & RE-DEDUCT
      if (oldStatus === 'CANCELLED' && targetStatus && targetStatus !== 'CANCELLED') {
        // First verify sufficient stock
        for (const item of existingOrder.items) {
          if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
            });
            if (!product || product.stock < item.quantity) {
              throw new Error(
                `สินค้า "${item.productName}" มีสต็อกไม่เพียงพอสำหรับการคืนสถานะออเดอร์`
              );
            }
          }
        }

        // Deduct stock again
        for (const item of existingOrder.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                sold: { increment: item.quantity },
              },
            });
          }
        }
      }

      // 3. Update customer address if provided (allowed only while status is PENDING)
      if (body.address !== undefined) {
        if (existingOrder.status !== 'PENDING') {
          throw new Error('ไม่สามารถแก้ไขที่อยู่จัดส่งได้ เนื่องจากร้านค้ายืนยันออเดอร์แล้ว');
        }
        await tx.customer.update({
          where: { id: existingOrder.customerId },
          data: { address: String(body.address).trim() },
        });
      }

      // 4. Update order record
      const updateData: {
        status?: string;
        note?: string | null;
        slipUrl?: string | null;
        paymentMethod?: string;
      } = {};
      if (targetStatus) updateData.status = targetStatus;
      if (note !== undefined) {
        if (existingOrder.status !== 'PENDING' && !targetStatus) {
          throw new Error('ไม่สามารถแก้ไขหมายเหตุได้ เนื่องจากร้านค้ายืนยันออเดอร์แล้ว');
        }
        updateData.note = note ? String(note).trim() : null;
      }
      if (slipUrl !== undefined) {
        updateData.slipUrl = trimmedSlipUrl || null;
      }
      if (paymentMethod !== undefined) {
        if (['TRANSFER', 'COD'].includes(paymentMethod)) {
          updateData.paymentMethod = paymentMethod;
        }
      }

      return await tx.order.update({
        where: { id: existingOrder.id },
        data: updateData,
        include: {
          customer: true,
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { displayOrder: 'asc' },
                  },
                },
              },
            },
          },
        },
      });
    });

    if (updatedOrder && hasSlipSubmission) {
      await notifySlipUploadedToLine(updatedOrder, runtimeEnv);
    }
    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    console.error('Error updating order:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
