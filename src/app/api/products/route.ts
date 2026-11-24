export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/products - list active products with images ordered by displayOrder
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // 'ACTIVE', 'INACTIVE', or 'all'
    const search = searchParams.get('search');
    const admin = searchParams.get('admin');

    const where: Prisma.ProductWhereInput = {};

    // Filter by status (default to ACTIVE unless admin=true or status='all' or specific status)
    if (status && status !== 'all') {
      where.status = status;
    } else if (!status && admin !== 'true') {
      where.status = 'ACTIVE';
    }

    // Filter by category
    if (category && category !== 'all') {
      where.category = category;
    }

    // Search keyword
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดรายการสินค้า' },
      { status: 500 }
    );
  }
}

// POST /api/products - create product with images and stock
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      stock,
      initialStock,
      category,
      status,
      images,
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อสินค้า' },
        { status: 400 }
      );
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'กรุณากรอกราคาที่ถูกต้อง' },
        { status: 400 }
      );
    }

    const parsedStock = stock !== undefined ? parseInt(stock, 10) : 0;
    if (isNaN(parsedStock) || parsedStock < 0) {
      return NextResponse.json(
        { error: 'กรุณากรอกจำนวนสต็อกที่ถูกต้อง' },
        { status: 400 }
      );
    }

    const parsedInitialStock =
      initialStock !== undefined
        ? parseInt(initialStock, 10)
        : parsedStock;

    // Process images
    let formattedImages: Prisma.ProductImageCreateWithoutProductInput[] = [];
    if (Array.isArray(images) && images.length > 0) {
      let hasPrimary = false;
      formattedImages = images.map((img: unknown, index: number) => {
        if (typeof img === 'string') {
          const isPrimary = !hasPrimary;
          hasPrimary = true;
          return {
            imageUrl: img,
            isPrimary,
            displayOrder: index + 1,
          };
        } else if (img && typeof img === 'object') {
          const imageObj = img as { imageUrl?: string; isPrimary?: boolean; displayOrder?: number };
          const isPrimary = Boolean(imageObj.isPrimary) || (!hasPrimary && index === 0);
          if (isPrimary) hasPrimary = true;
          return {
            imageUrl: imageObj.imageUrl || '',
            isPrimary,
            displayOrder: imageObj.displayOrder ?? index + 1,
          };
        }
        return {
          imageUrl: '',
          isPrimary: index === 0,
          displayOrder: index + 1,
        };
      }).filter((img) => img.imageUrl);

      // Ensure at least the first image is primary if none is marked
      if (formattedImages.length > 0 && !formattedImages.some((i) => i.isPrimary)) {
        formattedImages[0].isPrimary = true;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        price: parsedPrice,
        stock: parsedStock,
        initialStock: parsedInitialStock,
        sold: 0,
        category: category?.trim() || 'Bakery',
        status: status || 'ACTIVE',
        images: {
          create: formattedImages,
        },
      },
      include: {
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างสินค้า' },
      { status: 500 }
    );
  }
}
