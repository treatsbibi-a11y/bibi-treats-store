export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface OrderItemInput {
  productId?: string;
  quantity?: number;
  product?: {
    id: string;
  };
}

// POST /api/orders - atomic checkout transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract customer info (support both nested customer object and flat fields)
    const customerData = body.customer || {
      name: body.name,
      phone: body.phone,
      instagram: body.instagram,
      address: body.address,
    };

    if (!customerData?.name || typeof customerData.name !== 'string' || !customerData.name.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อผู้รับ' },
        { status: 400 }
      );
    }

    if (!customerData?.phone || typeof customerData.phone !== 'string' || !customerData.phone.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    if (!customerData?.address || typeof customerData.address !== 'string' || !customerData.address.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกที่อยู่จัดส่ง' },
        { status: 400 }
      );
    }

    // Extract items
    const rawItems: OrderItemInput[] = body.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ' },
        { status: 400 }
      );
    }

    // Normalize items
    const requestedItems = rawItems.map((item) => {
      const productId = item.productId || item.product?.id;
      const quantity = parseInt(String(item.quantity || 1), 10);
      return { productId, quantity };
    });

    for (const item of requestedItems) {
      if (!item.productId) {
        return NextResponse.json(
          { error: 'พบรายการสินค้าที่ไม่ถูกต้อง' },
          { status: 400 }
        );
      }
      if (isNaN(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'จำนวนสินค้าต้องมากกว่า 0' },
          { status: 400 }
        );
      }
    }

    // Execute atomic transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Verify store status
      const settings = await tx.storeSettings.findUnique({
        where: { id: 'default' },
      });

      if (settings && settings.isStoreOpen === false) {
        throw new Error('ขออภัย ขณะนี้ร้านปิดรับออเดอร์ชั่วคราว');
      }

      // 2. Verify stock and calculate subtotal using verified DB prices
      let subtotal = 0;
      const preparedOrderItems: {
        productId: string;
        productName: string;
        quantity: number;
        price: number;
        subtotal: number;
      }[] = [];

      for (const item of requestedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error('ไม่พบข้อมูลสินค้าบางรายการในระบบ');
        }

        if (product.status !== 'ACTIVE') {
          throw new Error(`สินค้า "${product.name}" ไม่พร้อมจำหน่ายในขณะนี้`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `สินค้า "${product.name}" มีสต็อกไม่เพียงพอ (คงเหลือ ${product.stock} ชิ้น)`
          );
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        preparedOrderItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
          subtotal: itemSubtotal,
        });
      }

      // 3. Decrement stock and increment sold for all items
      for (const item of preparedOrderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity },
          },
        });
      }

      // 4. Shipping fee and total
      const shippingFee =
        body.shippingFee !== undefined
          ? Number(body.shippingFee)
          : settings?.defaultShippingFee ?? 40;
      const total = subtotal + shippingFee;

      // 5. Generate unique orderNumber (e.g. BT-0001, BT-0002)
      const count = await tx.order.count();
      const lastOrder = await tx.order.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { orderNumber: true },
      });

      let maxNum = count;
      if (lastOrder && lastOrder.orderNumber.startsWith('BT-')) {
        const parsed = parseInt(lastOrder.orderNumber.replace('BT-', ''), 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }

      let nextNum = maxNum + 1;
      let orderNumber = `BT-${String(nextNum).padStart(4, '0')}`;
      let exists = await tx.order.findUnique({ where: { orderNumber } });
      while (exists) {
        nextNum++;
        orderNumber = `BT-${String(nextNum).padStart(4, '0')}`;
        exists = await tx.order.findUnique({ where: { orderNumber } });
      }

      // 6. Create customer record
      const customer = await tx.customer.create({
        data: {
          name: customerData.name.trim(),
          phone: customerData.phone.trim(),
          instagram: customerData.instagram?.trim() || null,
          address: customerData.address.trim(),
        },
      });

      // 7. Create order record
      const paymentMethod = body.paymentMethod === 'COD' ? 'COD' : 'TRANSFER';
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          subtotal,
          shippingFee,
          total,
          status: 'PENDING',
          paymentMethod,
          slipUrl: body.slipUrl ? String(body.slipUrl).trim() : null,
          note: body.note?.trim() || null,
          items: {
            create: preparedOrderItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
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

      return order;
    });

    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสั่งซื้อสินค้า';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// GET /api/orders - list orders for admin with status filter and sort by createdAt desc
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format'); // 'array' or 'object'

    const where: Prisma.OrderWhereInput = {};

    if (status && status !== 'ALL' && status !== 'all') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { phone: { contains: q } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.order.count({ where }),
    ]);

    if (format === 'object') {
      return NextResponse.json({
        orders,
        total,
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดรายการคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}
