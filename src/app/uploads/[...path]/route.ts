export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/lib/r2';

export const dynamic = 'force-dynamic';

const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bibi-treats-assets';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filename = params.path?.join('/') || '';
    if (!filename || filename.includes('..')) {
      return new NextResponse('File not found', { status: 404 });
    }

    const cleanKey = filename.startsWith('uploads/') ? filename : `uploads/${filename}`;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: cleanKey,
    });

    const data = await r2Client.send(command);
    if (!data.Body) {
      return new NextResponse('File not found', { status: 404 });
    }

    const bytes = await data.Body.transformToByteArray();
    const contentType = data.ContentType || 'image/jpeg';

    return new Response(bytes as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}
