export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveD1Binding, fetchR2Object } from '@/lib/d1-remote';

export const dynamic = 'force-dynamic';

function normalizeAssetKey(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  let cleaned = urlOrPath.trim();
  if (!cleaned) return null;
  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      cleaned = new URL(cleaned).pathname;
    }
  } catch {}
  cleaned = cleaned.split('?')[0].split('#')[0].replace(/^\/+/, '');
  return cleaned || null;
}

async function getProtectedQrImageUrl(): Promise<string | null> {
  const d1Binding = resolveD1Binding();
  if (d1Binding) {
    const row = await d1Binding
      .prepare(`SELECT qrImageUrl FROM StoreSettings LIMIT 1`)
      .bind()
      .first<{ qrImageUrl?: string | null }>();
    return row?.qrImageUrl ?? null;
  }

  const settings = await prisma.storeSettings.findFirst({
    select: { qrImageUrl: true },
  });
  return settings?.qrImageUrl ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filename = params.path?.join('/') || '';
    if (!filename || filename.includes('..') || filename.includes('\\') || filename.includes('\0')) {
      return new NextResponse('File not found', { status: 404 });
    }

    const cleanKey = filename.startsWith('uploads/') ? filename : `uploads/${filename}`;

    // Block direct access to StoreSettings.qrImageUrl; must go through /api/orders/[id]/payment-qr
    const qrImageUrl = await getProtectedQrImageUrl();
    const normalizedQrKey = normalizeAssetKey(qrImageUrl);
    if (
      normalizedQrKey &&
      (normalizedQrKey === cleanKey || `uploads/${normalizedQrKey}` === cleanKey)
    ) {
      return new NextResponse('Forbidden', {
        status: 403,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const obj = await fetchR2Object(cleanKey);
    if (!obj) {
      return new NextResponse('File not found', { status: 404 });
    }

    return new Response(obj.bytes as any, {
      status: 200,
      headers: {
        'Content-Type': obj.contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}
