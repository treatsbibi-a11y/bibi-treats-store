export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getD1StoreSettings } from '@/lib/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const dynamic = 'force-dynamic';

// GET /api/settings - public store settings for customer UI
export async function GET(req: NextRequest) {
  try {
    let d1Binding: any = null;
    try {
      d1Binding = (getRequestContext()?.env as any)?.DB;
    } catch {}

    if (d1Binding) {
      const d1Settings = await getD1StoreSettings(d1Binding);
      if (d1Settings) {
        return NextResponse.json(d1Settings);
      }
    }

    let settings = await prisma.storeSettings.findFirst();

    if (!settings) {
      settings = {
        id: 'default',
        shopName: "Bibi's Treats",
        tagline: 'Sweet treats, happy hearts',
        logoUrl: '/uploads/bibi-1795498989551-27zh7uk.png',
        qrImageUrl: '/uploads/bibi-1795444192478-qiwqv1g.jpg',
        promptpayNumber: '086-296-5765',
        promptpayName: 'น.ส. ฮาบีบี บุตรแหล่',
        bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
        bankAccountNo: '142-1-52907-4',
        bankAccountName: 'น.ส. ฮาบีบี บุตรแหล่',
        defaultShippingFee: 40,
        isStoreOpen: true,
        announcement: 'อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความพิถีพิถัน',
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดการตั้งค่าร้านค้า' },
      { status: 500 }
    );
  }
}
