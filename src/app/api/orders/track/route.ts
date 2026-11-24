export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
