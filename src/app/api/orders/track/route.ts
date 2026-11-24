export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { CloudflareD1Binding } from '@/lib/d1';

export const dynamic = 'force-dynamic';

function cleanPhone(phone: string): string {
  // Remove all non-digits, replace international +66 prefix with leading 0
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length >= 10) {
    return '0' + digits.substring(2);
  }
  return digits;
}

// POST /api/orders/track - verify orderNumber and phone number match
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, phone } = body;

    if (!orderNumber || typeof orderNumber !== 'string' || !orderNumber.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกหมายเลขคำสั่งซื้อ (เช่น BT-0001)' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกเบอร์โทรศัพท์ที่ใช้ในการสั่งซื้อ' },
        { status: 400 }
      );
    }

    const cleanOrderNumber = orderNumber.trim().toUpperCase();
    const normalizedInputPhone = cleanPhone(phone.trim());

    // Check Cloudflare D1 binding on Edge Runtime
    let d1Binding: CloudflareD1Binding | undefined;
    try {
      d1Binding = (getRequestContext()?.env as any)?.DB;
    } catch {}

    if (d1Binding) {
      const orderRow = (await d1Binding
        .prepare(`
          SELECT 
            o.id, o.orderNumber, o.customerId, o.subtotal, o.shippingFee, o.total,
            o.status, o.paymentMethod, o.slipUrl, o.note, o.createdAt, o.updatedAt,
            c.name as customer_name, c.phone as customer_phone, c.instagram as customer_instagram, c.address as customer_address
          FROM [Order] o
          JOIN Customer c ON o.customerId = c.id
          WHERE UPPER(o.orderNumber) = ?
          LIMIT 1
        `)
        .bind(cleanOrderNumber)
        .first()) as any;

      if (!orderRow) {
        return NextResponse.json(
          { error: 'ไม่พบหมายเลขคำสั่งซื้อนี้ กรุณาตรวจสอบอีกครั้ง' },
          { status: 404 }
        );
      }

      // Verify phone number match
      const normalizedCustomerPhone = cleanPhone(orderRow.customer_phone || '');

      const isMatch =
        normalizedCustomerPhone === normalizedInputPhone ||
        (normalizedCustomerPhone.length >= 9 &&
          normalizedInputPhone.length >= 9 &&
          (normalizedCustomerPhone.endsWith(normalizedInputPhone.slice(-9)) ||
            normalizedInputPhone.endsWith(normalizedCustomerPhone.slice(-9))));

      if (!isMatch) {
        return NextResponse.json(
          { error: 'หมายเลขคำสั่งซื้อหรือเบอร์โทรศัพท์ไม่ถูกต้อง' },
          { status: 400 }
        );
      }

      // Fetch items with primary image
      const { results: itemRows } = await d1Binding
        .prepare(`
          SELECT 
            oi.id, oi.productId, oi.productName, oi.quantity, oi.price, oi.subtotal,
            pi.imageUrl
          FROM OrderItem oi
          LEFT JOIN ProductImage pi ON oi.productId = pi.productId AND pi.isPrimary = 1
          WHERE oi.orderId = ?
        `)
        .bind(orderRow.id)
        .all();

      const formattedOrder = {
        id: orderRow.id,
        orderNumber: orderRow.orderNumber,
        status: orderRow.status,
        paymentMethod: orderRow.paymentMethod,
        slipUrl: orderRow.slipUrl,
        subtotal: Number(orderRow.subtotal),
        shippingFee: Number(orderRow.shippingFee),
        total: Number(orderRow.total),
        note: orderRow.note,
        createdAt: new Date(orderRow.createdAt).toISOString(),
        updatedAt: new Date(orderRow.updatedAt || orderRow.createdAt).toISOString(),
        customer: {
          name: orderRow.customer_name,
          phone: orderRow.customer_phone,
          instagram: orderRow.customer_instagram,
          address: orderRow.customer_address,
        },
        items: (itemRows || []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity),
          price: Number(item.price),
          subtotal: Number(item.subtotal),
          imageUrl: item.imageUrl || null,
        })),
      };

      return NextResponse.json({
        success: true,
        order: formattedOrder,
        ...formattedOrder,
      });
    }

    // Find the order by orderNumber
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: cleanOrderNumber,
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
        { error: 'ไม่พบหมายเลขคำสั่งซื้อนี้ กรุณาตรวจสอบอีกครั้ง' },
        { status: 404 }
      );
    }

    // Verify phone number match
    const normalizedCustomerPhone = cleanPhone(order.customer.phone);

    const isMatch =
      normalizedCustomerPhone === normalizedInputPhone ||
      (normalizedCustomerPhone.length >= 9 &&
        normalizedInputPhone.length >= 9 &&
        (normalizedCustomerPhone.endsWith(normalizedInputPhone.slice(-9)) ||
          normalizedInputPhone.endsWith(normalizedCustomerPhone.slice(-9))));

    if (!isMatch) {
      return NextResponse.json(
        { error: 'หมายเลขคำสั่งซื้อหรือเบอร์โทรศัพท์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Format safe order response without leaking other customer data
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      slipUrl: order.slipUrl,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      note: order.note,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        instagram: order.customer.instagram,
        address: order.customer.address,
      },
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        imageUrl:
          item.product?.images.find((img) => img.isPrimary)?.imageUrl ||
          item.product?.images[0]?.imageUrl ||
          null,
      })),
    };

    // Return with both root fields and nested 'order' property for maximum frontend compatibility
    return NextResponse.json({
      success: true,
      order: formattedOrder,
      ...formattedOrder,
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}
