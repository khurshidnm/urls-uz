import type { MetadataRoute } from 'next';
import { desc } from 'drizzle-orm';
import { pg } from '@/db/client';
import { bioPages } from '@/db/schema';
import { SITE_URL } from '@/lib/site';

// Bio pages come from the database, so the sitemap is built per request (and cached by crawlers)
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await pg
    .select({ handle: bioPages.handle, updated_at: bioPages.updated_at })
    .from(bioPages)
    .orderBy(desc(bioPages.updated_at))
    .limit(10_000);

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...pages.map((p) => ({
      url: `${SITE_URL}/b/${encodeURIComponent(p.handle)}`,
      lastModified: p.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
