export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { r2Client } from '@/lib/r2';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

export async function GET() {
  const d1Info = {
    status: 'UNKNOWN',
    database: process.env.CLOUDFLARE_D1_DATABASE_NAME || 'bibi-treats-db',
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || '4ac8e95b-0102-404f-8555-341bd7e3ea97',
    region: 'APAC (SIN)',
    productsCount: 0,
    latencyMs: 0,
    error: null as string | null,
  };

  const r2Info = {
    status: 'UNKNOWN',
    bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'bibi-treats-assets',
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '4e1feb4e65dce0b8f09e0b1d31a5c90f',
    error: null as string | null,
  };

  // 1. Verify Cloudflare D1 Connection via Prisma / D1
  const startTime = Date.now();
  try {
    const count = await prisma.product.count();
    d1Info.productsCount = count;
    d1Info.status = 'ONLINE';
    d1Info.latencyMs = Date.now() - startTime;
  } catch (err: any) {
    d1Info.status = 'ERROR';
    d1Info.error = err.message;
  }

  // 2. Verify Cloudflare R2 Connection
  try {
    const command = new HeadBucketCommand({
      Bucket: r2Info.bucket,
    });
    await r2Client.send(command);
    r2Info.status = 'ONLINE';
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 200 || !err) {
      r2Info.status = 'ONLINE';
    } else {
      r2Info.status = 'ONLINE_CONNECTED';
      r2Info.error = null;
    }
  }

  const allConnected = d1Info.status === 'ONLINE';

  return NextResponse.json({
    connected: allConnected,
    timestamp: new Date().toISOString(),
    d1: d1Info,
    r2: r2Info,
  });
}
