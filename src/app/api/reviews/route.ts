export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { resolveD1Binding } from '@/lib/d1-remote';
import { createD1Review, getD1Reviews } from '@/lib/d1';

export const dynamic = 'force-dynamic';

// GET /api/reviews - fetch visible customer reviews with live stats, filter, and sort
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ratingParam = searchParams.get('rating');
    const hasImagesParam = searchParams.get('hasImages');
    const sortParam = searchParams.get('sort');

    const rating =
      ratingParam && ratingParam !== 'all' ? parseInt(ratingParam, 10) : undefined;
    const hasImages = hasImagesParam === 'true';
    const sort =
      sortParam === 'highest' || sortParam === 'lowest' ? sortParam : 'latest';

    const d1Binding = resolveD1Binding();

    const data = await getD1Reviews({
      rating: rating && !isNaN(rating) ? rating : undefined,
      hasImages,
      sort,
      d1Binding,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดรีวิวลูกค้าได้ในขณะนี้' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - submit a new customer review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerName =
      typeof body.customerName === 'string' ? body.customerName.trim() : '';
    const rating = parseInt(String(body.rating), 10);
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    const rawImages = Array.isArray(body.images) ? body.images : [];

    if (!customerName) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อของคุณ' },
        { status: 400 }
      );
    }

    if (customerName.length > 60) {
      return NextResponse.json(
        { error: 'ชื่อต้องมีความยาวไม่เกิน 60 ตัวอักษร' },
        { status: 400 }
      );
    }

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'กรุณาให้คะแนนตั้งแต่ 1 ถึง 5 ดาว' },
        { status: 400 }
      );
    }

    if (!comment || comment.length < 3) {
      return NextResponse.json(
        { error: 'กรุณาเขียนความคิดเห็นอย่างน้อย 3 ตัวอักษร' },
        { status: 400 }
      );
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        { error: 'ข้อความรีวิวต้องไม่เกิน 1,000 ตัวอักษร' },
        { status: 400 }
      );
    }

    const images = rawImages
      .filter((u: unknown): u is string => {
        if (typeof u !== 'string') return false;
        const trimmed = u.trim();
        return trimmed.startsWith('/uploads/') || trimmed.startsWith('https://');
      })
      .map((u: string) => u.trim())
      .slice(0, 5);
    const productId =
      typeof body.productId === 'string' && body.productId.trim() ? body.productId.trim() : null;
    const productName =
      typeof body.productName === 'string' && body.productName.trim() ? body.productName.trim() : null;

    const d1Binding = resolveD1Binding();

    const result = await createD1Review({
      customerName,
      rating,
      comment,
      images,
      productId,
      productName,
      d1Binding,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกรีวิว กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
