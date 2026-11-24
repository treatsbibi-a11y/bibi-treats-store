export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/products/[id] - product detail
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสินค้านี้' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - update product fields
export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    const body = await req.json();

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้าที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    const updateData: Prisma.ProductUpdateInput = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'ชื่อสินค้าต้องไม่เป็นค่าว่าง' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = String(body.description || '').trim();
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: 'ราคาต้องเป็นตัวเลขที่ถูกต้อง' }, { status: 400 });
      }
      updateData.price = price;
    }

    if (body.stock !== undefined) {
      const stock = parseInt(body.stock, 10);
      if (isNaN(stock) || stock < 0) {
        return NextResponse.json({ error: 'จำนวนสต็อกต้องไม่ติดลบ' }, { status: 400 });
      }
      updateData.stock = stock;
    }

    if (body.initialStock !== undefined) {
      const initialStock = parseInt(body.initialStock, 10);
      if (!isNaN(initialStock) && initialStock >= 0) {
        updateData.initialStock = initialStock;
      }
    }

    if (body.sold !== undefined) {
      const sold = parseInt(body.sold, 10);
      if (!isNaN(sold) && sold >= 0) {
        updateData.sold = sold;
      }
    }

    if (body.category !== undefined) {
      updateData.category = String(body.category).trim() || 'Bakery';
    }

    if (body.status !== undefined) {
      const validStatuses = ['ACTIVE', 'INACTIVE'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'สถานะสินค้าไม่ถูกต้อง (ACTIVE หรือ INACTIVE)' }, { status: 400 });
      }
      updateData.status = body.status;
    }

    // Optional: if images array is provided in PUT, update/sync images
    if (Array.isArray(body.images)) {
      // Delete existing and replace, or preserve
      await prisma.productImage.deleteMany({
        where: { productId: id },
      });

      let hasPrimary = false;
      const newImages = body.images.map((img: unknown, index: number) => {
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
      }).filter((img: { imageUrl: string }) => Boolean(img.imageUrl));

      if (newImages.length > 0 && !newImages.some((i: { isPrimary: boolean }) => i.isPrimary)) {
        newImages[0].isPrimary = true;
      }

      updateData.images = {
        create: newImages,
      };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - soft delete / set status INACTIVE
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้าที่ต้องการลบ' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to INACTIVE
    const updated = await prisma.product.update({
      where: { id },
      data: {
        status: 'INACTIVE',
      },
      include: {
        images: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'สินค้าถูกปิดการขายเรียบร้อยแล้ว (INACTIVE)',
      product: updated,
    });
  } catch (error) {
    console.error('Error deactivating product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการปิดการขายสินค้า' },
      { status: 500 }
    );
  }
}
