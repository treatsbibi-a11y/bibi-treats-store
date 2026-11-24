import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { uploadFileToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('image')) as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'ไม่พบไฟล์รูปภาพ กรุณาเลือกไฟล์' },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่านี้' },
        { status: 400 }
      );
    }

    // Validate mime type & extension
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const mimeType = file.type?.toLowerCase();
    const originalName = file.name || 'image.jpg';
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const rawExt = extMatch ? extMatch[1].toLowerCase() : '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];

    const isValidMime = mimeType && allowedMimeTypes.includes(mimeType);
    const isValidExt = rawExt && allowedExts.includes(rawExt);

    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        { error: 'รองรับเฉพาะไฟล์รูปภาพประเภท JPG, PNG และ WEBP เท่านั้น' },
        { status: 400 }
      );
    }

    const finalExt = rawExt === 'jpeg' ? 'jpg' : rawExt || (mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg');
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filename = `bibi-${uniqueId}.${finalExt}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // Sync asset to Cloudflare R2 bucket
    uploadFileToR2(`uploads/${filename}`, buffer, file.type || `image/${finalExt}`).catch((err) => {
      console.warn('[Cloudflare R2] Background upload sync warning:', err?.message || err);
    });

    const relativeUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: relativeUrl,
      filename,
      size: file.size,
      mimeType: file.type || `image/${finalExt}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' },
      { status: 500 }
    );
  }
}
