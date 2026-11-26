export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { resolveD1Binding } from '@/lib/d1-remote';
import { getD1Products } from '@/lib/d1';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin =
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    'https://bibitreats.com';

  const urls: string[] = [
    `${origin}/`,
    `${origin}/tracking`,
  ];

  try {
    const d1Binding = resolveD1Binding();
    const products = await getD1Products({ d1Binding, status: 'ACTIVE' });
    if (Array.isArray(products)) {
      products.forEach((p) => {
        if (p.id) {
          urls.push(`${origin}/?product=${encodeURIComponent(p.id)}`);
        }
      });
    }
  } catch (err) {
    console.error('Error generating sitemap.txt:', err);
  }

  const content = urls.join('\n') + '\n';

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
