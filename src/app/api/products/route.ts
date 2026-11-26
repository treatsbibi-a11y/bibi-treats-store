export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getD1Products } from '@/lib/d1';
import { resolveD1Binding } from '@/lib/d1-remote';

export const dynamic = 'force-dynamic';

// GET /api/products - list active products with images ordered by displayOrder
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const search = searchParams.get('search') || undefined;

    const d1Binding = resolveD1Binding();

    const products = await getD1Products({
      category,
      search,
      status,
      d1Binding,
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการโหลดรายการสินค้า' },
      { status: 500 }
    );
  }
}
