export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveD1Binding, CloudflareD1Binding } from '@/lib/d1-remote';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

async function listD1ProductImages(d1: CloudflareD1Binding, productId: string) {
  const { results } = await d1
    .prepare(
      `SELECT id, productId, imageUrl, isPrimary, displayOrder
       FROM ProductImage WHERE productId = ? ORDER BY displayOrder ASC`
    )
    .bind(productId)
    .all<any>();

  return (results || []).map((img: any) => ({
    id: img.id,
    productId: img.productId,
    imageUrl: img.imageUrl,
    isPrimary: Boolean(img.isPrimary),
    displayOrder: Number(img.displayOrder),
  }));
}

// POST /api/products/[id]/images - add image (admin only)
export async function POST(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const body = await req.json();
    const { imageUrl, isPrimary, displayOrder } = body;

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return NextResponse.json(
        { error: 'กรุณาระบุ URL ของรูปภาพ' },
        { status: 400 }
      );
    }

    const d1 = resolveD1Binding();
    if (d1) {
      const product = await d1
        .prepare(`SELECT id FROM Product WHERE id = ? LIMIT 1`)
        .bind(id)
        .first<any>();

      if (!product) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลสินค้านี้' },
          { status: 404 }
        );
      }

      const existingImages = await listD1ProductImages(d1, id);
      const currentImagesCount = existingImages.length;
      const shouldBePrimary =
        isPrimary !== undefined ? Boolean(isPrimary) : currentImagesCount === 0;

      if (shouldBePrimary) {
        await d1
          .prepare(`UPDATE ProductImage SET isPrimary = 0 WHERE productId = ?`)
          .bind(id)
          .run();
      }

      const nextOrder =
        displayOrder !== undefined ? Number(displayOrder) : currentImagesCount + 1;

      await d1
        .prepare(
          `INSERT INTO ProductImage (id, productId, imageUrl, isPrimary, displayOrder)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(crypto.randomUUID(), id, imageUrl.trim(), shouldBePrimary ? 1 : 0, nextOrder)
        .run();

      const updatedImages = await listD1ProductImages(d1, id);
      return NextResponse.json(updatedImages, { status: 201 });
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

    return NextResponse.json(updatedImages, { status: 201 });
  } catch (error) {
    console.error('Error adding product image:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเพิ่มรูปภาพสินค้า' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id]/images - reorder images or set primary (admin only)
export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const body = await req.json();

    const d1 = resolveD1Binding();
    if (d1) {
      const product = await d1
        .prepare(`SELECT id FROM Product WHERE id = ? LIMIT 1`)
        .bind(id)
        .first<any>();

      if (!product) {
        return NextResponse.json(
          { error: 'ไม่พบข้อมูลสินค้านี้' },
          { status: 404 }
        );
      }

      if (body.action === 'SET_PRIMARY' || (body.imageId && body.isPrimary)) {
        const targetId = body.imageId;
        await d1
          .prepare(`UPDATE ProductImage SET isPrimary = 0 WHERE productId = ?`)
          .bind(id)
          .run();
        await d1
          .prepare(`UPDATE ProductImage SET isPrimary = 1 WHERE id = ? AND productId = ?`)
          .bind(targetId, id)
          .run();
      } else if (body.action === 'REORDER' && Array.isArray(body.orderedIds)) {
        for (let index = 0; index < body.orderedIds.length; index++) {
          await d1
            .prepare(`UPDATE ProductImage SET displayOrder = ? WHERE id = ? AND productId = ?`)
            .bind(index + 1, body.orderedIds[index], id)
            .run();
        }
      } else if (Array.isArray(body.images)) {
        for (const item of body.images as { id: string; displayOrder?: number; isPrimary?: boolean }[]) {
          const updates: string[] = [];
          const vals: any[] = [];
          if (item.displayOrder !== undefined) {
            updates.push('displayOrder = ?');
            vals.push(item.displayOrder);
          }
          if (item.isPrimary !== undefined) {
            updates.push('isPrimary = ?');
            vals.push(item.isPrimary ? 1 : 0);
          }
          if (updates.length > 0) {
            vals.push(item.id, id);
            await d1
              .prepare(`UPDATE ProductImage SET ${updates.join(', ')} WHERE id = ? AND productId = ?`)
              .bind(...vals)
              .run();
          }
        }
      } else {
        return NextResponse.json(
          { error: 'ข้อมูลสำหรับอัปเดตรูปภาพไม่ถูกต้อง' },
          { status: 400 }
        );
      }

      const updatedImages = await listD1ProductImages(d1, id);
      return NextResponse.json(updatedImages);
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

// DELETE /api/products/[id]/images - delete image (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    const d1 = resolveD1Binding();
    if (d1) {
      const targetImage = await d1
        .prepare(`SELECT id, isPrimary FROM ProductImage WHERE id = ? AND productId = ? LIMIT 1`)
        .bind(imageId, id)
        .first<any>();

      if (!targetImage) {
        return NextResponse.json(
          { error: 'ไม่พบรูปภาพนี้ในสินค้า' },
          { status: 404 }
        );
      }

      const wasPrimary = Boolean(targetImage.isPrimary);

      await d1
        .prepare(`DELETE FROM ProductImage WHERE id = ? AND productId = ?`)
        .bind(imageId, id)
        .run();

      if (wasPrimary) {
        const remainingFirst = await d1
          .prepare(`SELECT id FROM ProductImage WHERE productId = ? ORDER BY displayOrder ASC LIMIT 1`)
          .bind(id)
          .first<any>();

        if (remainingFirst) {
          await d1
            .prepare(`UPDATE ProductImage SET isPrimary = 1 WHERE id = ?`)
            .bind(remainingFirst.id)
            .run();
        }
      }

      const remainingImages = await listD1ProductImages(d1, id);
      return NextResponse.json(remainingImages);
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
