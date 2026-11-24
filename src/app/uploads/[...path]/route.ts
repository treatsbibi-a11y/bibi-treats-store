export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filename = params.path?.join('/') || '';
    if (!filename || filename.includes('..')) {
      return new NextResponse('File not found', { status: 404 });
    }

    // First check bibi-store public/uploads
    let filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    // If not found, check admin-bibi-store public/uploads
    if (!fs.existsSync(filePath)) {
      const adminPath = path.resolve(process.cwd(), '..', 'admin-bibi-store', 'public', 'uploads', filename);
      if (fs.existsSync(adminPath)) {
        filePath = adminPath;
      }
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const contentTypeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving upload file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
