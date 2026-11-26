import { MetadataRoute } from 'next';
import { resolveD1Binding } from '@/lib/d1-remote';
import { getD1Products } from '@/lib/d1';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://bibitreats.com';

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tracking`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    const d1Binding = resolveD1Binding();
    const products = await getD1Products({ d1Binding, status: 'ACTIVE' });
    const productEntries: MetadataRoute.Sitemap = (products || []).map((p) => ({
      url: `${baseUrl}/?product=${encodeURIComponent(p.id)}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...staticEntries, ...productEntries];
  } catch {
    return staticEntries;
  }
}
