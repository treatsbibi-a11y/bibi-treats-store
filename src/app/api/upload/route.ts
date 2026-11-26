export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
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
    const MAX_SIZE = 5 * 1024 * 1024;
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

    const bytes = await file.arrayBuffer();
    const uint8 = new Uint8Array(bytes);

    // Verify magic bytes (do not trust client-supplied MIME or extension)
    const isJpeg =
      uint8.length >= 3 && uint8[0] === 0xff && uint8[1] === 0xd8 && uint8[2] === 0xff;
    const isPng =
      uint8.length >= 8 &&
      uint8[0] === 0x89 &&
      uint8[1] === 0x50 &&
      uint8[2] === 0x4e &&
      uint8[3] === 0x47 &&
      uint8[4] === 0x0d &&
      uint8[5] === 0x0a &&
      uint8[6] === 0x1a &&
      uint8[7] === 0x0a;
    const isWebp =
      uint8.length >= 12 &&
      uint8[0] === 0x52 &&
      uint8[1] === 0x49 &&
      uint8[2] === 0x46 &&
      uint8[3] === 0x46 &&
      uint8[8] === 0x57 &&
      uint8[9] === 0x45 &&
      uint8[10] === 0x42 &&
      uint8[11] === 0x50;

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json(
        { error: 'ไฟล์รูปภาพไม่ถูกต้อง รองรับเฉพาะ JPG, PNG และ WEBP เท่านั้น' },
        { status: 400 }
      );
    }

    const verifiedExt = isPng ? 'png' : isWebp ? 'webp' : 'jpg';
    const verifiedMime = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filename = `bibi-${uniqueId}.${verifiedExt}`;

    // Upload directly to Cloudflare R2 bucket
    await uploadFileToR2(`uploads/${filename}`, uint8, verifiedMime);

    const relativeUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: relativeUrl,
      filename,
      size: file.size,
      mimeType: verifiedMime,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' },
      { status: 500 }
    );
  }
}
