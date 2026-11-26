export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getD1StoreSettings } from '@/lib/d1';
import { resolveD1Binding } from '@/lib/d1-remote';

export const dynamic = 'force-dynamic';

// Public store settings for customer UI (including store payment details for checkout)
function sanitizePublicSettings<T extends Record<string, any>>(settings: T) {
  return {
    ...settings,
    qrImageUrl: settings.qrImageUrl || '/images/thai-qr-payment.jpg',
    promptpayNumber: settings.promptpayNumber || '086-296-5765',
    promptpayName: settings.promptpayName || 'น.ส. ฮาบีบี บุตรแหล่',
    bankName: settings.bankName || 'ธนาคารกสิกรไทย (Kasikorn Bank)',
    bankAccountNo: settings.bankAccountNo || '142-1-52907-4',
    bankAccountName: settings.bankAccountName || 'น.ส. ฮาบีบี บุตรแหล่',
  };
}

// GET /api/settings - public store settings for customer UI
export async function GET(req: NextRequest) {
  try {
    const d1Binding = resolveD1Binding();

    if (d1Binding) {
      const d1Settings = await getD1StoreSettings(d1Binding);
      const result = d1Settings ?? {
        id: 'default',
        shopName: "Bibi's Treats",
        tagline: 'Sweet treats, happy hearts',
        logoUrl: '/uploads/bibi-1795498989551-27zh7uk.png',
        qrImageUrl: null,
        promptpayNumber: '',
        promptpayName: '',
        bankName: '',
        bankAccountNo: '',
        bankAccountName: '',
        defaultShippingFee: 40,
        isStoreOpen: true,
        announcement: 'อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความพิถีพิถัน',
      };
      return NextResponse.json(sanitizePublicSettings(result), {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    let settings = await prisma.storeSettings.findFirst();

    if (!settings) {
      settings = {
        id: 'default',
        shopName: "Bibi's Treats",
        tagline: 'Sweet treats, happy hearts',
        logoUrl: '/uploads/bibi-1795498989551-27zh7uk.png',
        qrImageUrl: null,
        promptpayNumber: '',
        promptpayName: '',
        bankName: '',
        bankAccountNo: '',
        bankAccountName: '',
        defaultShippingFee: 40,
        isStoreOpen: true,
        announcement: 'อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความพิถีพิถัน',
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(sanitizePublicSettings(settings), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดการตั้งค่าร้านค้า' },
      { status: 500 }
    );
  }
}
