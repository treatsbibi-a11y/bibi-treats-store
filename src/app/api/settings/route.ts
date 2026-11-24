import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/settings - public store settings for customer UI
export async function GET(req: NextRequest) {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          id: 'default',
          shopName: "Bibi's Treats",
          tagline: 'Sweet treats, happy hearts',
          promptpayNumber: '086-296-5765',
          promptpayName: 'น.ส. ฮาบีบี บุตรแหล่',
          bankName: 'ธนาคารกสิกรไทย (Kasikorn Bank)',
          bankAccountNo: '142-1-52907-4',
          bankAccountName: 'น.ส. ฮาบีบี บุตรแหล่',
          defaultShippingFee: 40,
          isStoreOpen: true,
          announcement: 'อบสดใหม่ทุกวัน ส่งตรงถึงบ้านคุณด้วยความพิถีพิถัน',
        },
      });
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
