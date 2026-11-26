import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://bibitreats.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tracking'],
        disallow: ['/api/', '/checkout', '/cart', '/order-success/'],
      },
      {
        userAgent: ['Googlebot', 'Google-Extended'],
        allow: ['/', '/tracking'],
        disallow: ['/api/', '/checkout', '/cart', '/order-success/'],
      },
      {
        userAgent: ['Bingbot', 'Applebot', 'Applebot-Extended'],
        allow: ['/', '/tracking'],
        disallow: ['/api/', '/checkout', '/cart', '/order-success/'],
      },
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'cohere-ai',
          'CCBot',
        ],
        allow: ['/', '/tracking'],
        disallow: ['/api/', '/checkout', '/cart', '/order-success/'],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap.txt`,
    ],
  };
}
