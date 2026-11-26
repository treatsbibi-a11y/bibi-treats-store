export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getD1StoreSettings } from '@/lib/d1';
import { resolveD1Binding, fetchR2Object } from '@/lib/d1-remote';

export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

interface RouteContext {
  params: {
    id: string;
  };
}

interface OrderPaymentGate {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
}

function resolveR2KeyFromQrUrl(qrImageUrl: string | null | undefined): string | null {
  if (!qrImageUrl) return null;
  let key = qrImageUrl.trim();
  if (!key) return null;
  try {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      key = new URL(key).pathname;
    }
  } catch {}
  key = key.split('?')[0].split('#')[0].replace(/^\/+/, '');
  if (!key) return null;
  if (!key.startsWith('uploads/') && !key.startsWith('images/')) {
    key = `uploads/${key}`;
  }
  return key;
}

// GET /api/orders/[id]/payment-qr - returns QR image or payment metadata only when order is CONFIRMED + TRANSFER
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const d1Binding = resolveD1Binding();

    let order: OrderPaymentGate | null = null;
    if (d1Binding) {
      const row = await d1Binding
        .prepare(
          `SELECT id, orderNumber, total, status, paymentMethod
           FROM [Order]
           WHERE id = ? OR orderNumber = ?
           LIMIT 1`
        )
        .bind(id, id)
        .first<any>();
      if (row) {
        order = {
          id: row.id,
          orderNumber: row.orderNumber,
          total: Number(row.total),
          status: row.status,
          paymentMethod: row.paymentMethod,
        };
      }
    } else {
      const found = await prisma.order.findFirst({
        where: {
          OR: [{ id }, { orderNumber: id }],
        },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentMethod: true,
        },
      });
      if (found) {
        order = found;
      }
    }

    if (!order) {
      return NextResponse.json(
        { allowed: false, error: 'ไม่พบข้อมูลคำสั่งซื้อ' },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    if (order.status !== 'CONFIRMED' || order.paymentMethod !== 'TRANSFER') {
      return NextResponse.json(
        {
          allowed: false,
          status: order.status,
          error: 'ไม่สามารถแสดง QR Code ได้ กรุณารอร้านยืนยันคำสั่งซื้อ',
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const settings = await getD1StoreSettings(d1Binding);
    const mode = req.nextUrl.searchParams.get('mode');

    if (mode === 'image') {
      const r2Key = resolveR2KeyFromQrUrl(settings?.qrImageUrl);
      if (!r2Key) {
        return NextResponse.json(
          { error: 'ไม่พบรูปภาพ QR Code' },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      const obj = await fetchR2Object(r2Key);
      if (!obj) {
        return NextResponse.json(
          { error: 'ไม่พบรูปภาพ QR Code' },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      return new Response(obj.bytes as any, {
        status: 200,
        headers: {
          'Content-Type': obj.contentType,
          ...NO_STORE_HEADERS,
        },
      });
    }

    return NextResponse.json(
      {
        allowed: true,
        orderNumber: order.orderNumber,
        total: order.total,
        qrEndpoint: `/api/orders/${order.orderNumber}/payment-qr?mode=image`,
        promptpayNumber: settings?.promptpayNumber ?? null,
        promptpayName: settings?.promptpayName ?? null,
        bankName: settings?.bankName ?? null,
        bankAccountNo: settings?.bankAccountNo ?? null,
        bankAccountName: settings?.bankAccountName ?? null,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error('Error serving payment QR:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล QR Code' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
