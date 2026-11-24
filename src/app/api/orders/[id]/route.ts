import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

const VALID_STATUSES = [
  'PENDING',
  'CONFIRMED',
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
    const body = await req.json();
    const newStatus = body.status as ValidStatus | undefined;
    const note = body.note;
    const slipUrl = body.slipUrl;
    const paymentMethod = body.paymentMethod;

    if (newStatus && !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: 'สถานะคำสั่งซื้อไม่ถูกต้อง' },
        { status: 400 }
      );
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

    const oldStatus = existingOrder.status;

    // Execute atomic transaction for status update and stock restock/adjust
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. If transitioning to CANCELLED from an active status: RESTOCK
      if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
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
      if (oldStatus === 'CANCELLED' && newStatus && newStatus !== 'CANCELLED') {
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
      if (newStatus) updateData.status = newStatus;
      if (note !== undefined) {
        if (existingOrder.status !== 'PENDING' && !newStatus) {
          throw new Error('ไม่สามารถแก้ไขหมายเหตุได้ เนื่องจากร้านค้ายืนยันออเดอร์แล้ว');
        }
        updateData.note = note ? String(note).trim() : null;
      }
      if (slipUrl !== undefined) {
        updateData.slipUrl = slipUrl ? String(slipUrl).trim() : null;
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

    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    console.error('Error updating order:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
