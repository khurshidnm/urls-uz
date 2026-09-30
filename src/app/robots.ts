import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/** Public pages are the landing page and bio pages; the app, APIs and short links aren't for search results. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/b/'],
      disallow: ['/dashboard', '/api/', '/login', '/demo'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
