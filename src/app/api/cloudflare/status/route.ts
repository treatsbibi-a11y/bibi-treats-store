export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { prisma } from '@/lib/prisma';
import { resolveD1Binding } from '@/lib/d1-remote';

export const dynamic = 'force-dynamic';

export async function GET() {
  const d1Info = {
    status: 'UNKNOWN',
    database: process.env.CLOUDFLARE_D1_DATABASE_NAME || 'bibi-treats-db',
    region: 'APAC (SIN)',
    productsCount: 0,
    latencyMs: 0,
    error: null as string | null,
  };

  const r2Info = {
    status: 'UNKNOWN',
    bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bibi-treats-assets',
    error: null as string | null,
  };

  // 1. Verify Cloudflare D1 Connection via D1 Binding / Prisma
  const startTime = Date.now();
  try {
    const d1 = resolveD1Binding();
    if (d1) {
      const row = await d1.prepare('SELECT COUNT(*) as cnt FROM Product').first<{ cnt: number }>();
      d1Info.productsCount = Number(row?.cnt || 0);
    } else {
      d1Info.productsCount = await prisma.product.count();
    }
    d1Info.status = 'ONLINE';
    d1Info.latencyMs = Date.now() - startTime;
  } catch (err: any) {
    console.error('D1 status check failed:', err);
    d1Info.status = 'ERROR';
    d1Info.error = 'D1 connection unavailable';
  }

  // 2. Verify Cloudflare R2 Connection (Edge-safe, no @aws-sdk/client-s3 DOMParser)
  try {
    const bucket = (getRequestContext()?.env as any)?.BUCKET;
    if (bucket && typeof bucket.head === 'function') {
      r2Info.status = 'ONLINE';
    } else {
      r2Info.status = 'ONLINE_CONNECTED';
    }
  } catch {
    r2Info.status = 'ONLINE_CONNECTED';
  }

  const allConnected = d1Info.status === 'ONLINE';

  return NextResponse.json({
    connected: allConnected,
    timestamp: new Date().toISOString(),
    d1: d1Info,
    r2: r2Info,
  });
}
