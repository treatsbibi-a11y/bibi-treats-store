export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

// POST /api/products/[id]/images - add image
export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { imageUrl, isPrimary, displayOrder } = body;

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return NextResponse.json(
        { error: 'กรุณาระบุ URL ของรูปภาพ' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสินค้านี้' },
        { status: 404 }
      );
    }

    const currentImagesCount = product.images.length;
    const shouldBePrimary =
      isPrimary !== undefined ? Boolean(isPrimary) : currentImagesCount === 0;

    if (shouldBePrimary) {
      await prisma.productImage.updateMany({
        where: { productId: id },
        data: { isPrimary: false },
      });
    }

    const nextOrder =
      displayOrder !== undefined ? Number(displayOrder) : currentImagesCount + 1;

    await prisma.productImage.create({
      data: {
        productId: id,
        imageUrl: imageUrl.trim(),
        isPrimary: shouldBePrimary,
        displayOrder: nextOrder,
      },
    });

    const updatedImages = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { displayOrder: 'asc' },
    });

    // Return array of updated images for frontend compatibility
    return NextResponse.json(updatedImages, { status: 201 });
  } catch (error) {
    console.error('Error adding product image:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มรูปภาพสินค้า' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id]/images - reorder images or set primary
export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    const body = await req.json();

    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสินค้านี้' },
        { status: 404 }
      );
    }

    // Action 1: SET_PRIMARY
    if (body.action === 'SET_PRIMARY' || (body.imageId && body.isPrimary)) {
      const targetId = body.imageId;
      await prisma.$transaction([
        prisma.productImage.updateMany({
          where: { productId: id },
          data: { isPrimary: false },
        }),
        prisma.productImage.update({
          where: { id: targetId },
          data: { isPrimary: true },
        }),
      ]);
    }
    // Action 2: REORDER with orderedIds: string[]
    else if (body.action === 'REORDER' && Array.isArray(body.orderedIds)) {
      await prisma.$transaction(
        body.orderedIds.map((imgId: string, index: number) =>
          prisma.productImage.update({
            where: { id: imgId },
            data: { displayOrder: index + 1 },
          })
        )
      );
    }
    // Action 3: Batch update [{ id, displayOrder, isPrimary }]
    else if (Array.isArray(body.images)) {
      await prisma.$transaction(
        body.images.map((item: { id: string; displayOrder?: number; isPrimary?: boolean }) =>
          prisma.productImage.update({
            where: { id: item.id },
            data: {
              ...(item.displayOrder !== undefined ? { displayOrder: item.displayOrder } : {}),
              ...(item.isPrimary !== undefined ? { isPrimary: item.isPrimary } : {}),
            },
          })
        )
      );
    } else {
      return NextResponse.json(
        { error: 'ข้อมูลสำหรับอัปเดตรูปภาพไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const updatedImages = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(updatedImages);
  } catch (error) {
    console.error('Error updating product images:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตรูปภาพสินค้า' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id]/images - delete image
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    let imageId = searchParams.get('imageId');

    if (!imageId) {
      try {
        const body = await req.json();
        imageId = body?.imageId;
      } catch {
        // no body
      }
    }

    if (!imageId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ imageId ที่ต้องการลบ' },
        { status: 400 }
      );
    }

    const targetImage = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });

    if (!targetImage) {
      return NextResponse.json(
        { error: 'ไม่พบรูปภาพนี้ในสินค้า' },
        { status: 404 }
      );
    }

    const wasPrimary = targetImage.isPrimary;

    await prisma.productImage.delete({
      where: { id: imageId },
    });

    // If deleted image was primary, set the first remaining image as primary
    if (wasPrimary) {
      const remainingFirst = await prisma.productImage.findFirst({
        where: { productId: id },
        orderBy: { displayOrder: 'asc' },
      });

      if (remainingFirst) {
        await prisma.productImage.update({
          where: { id: remainingFirst.id },
          data: { isPrimary: true },
        });
      }
    }

    const remainingImages = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(remainingImages);
  } catch (error) {
    console.error('Error deleting product image:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบรูปภาพสินค้า' },
      { status: 500 }
    );
  }
}
