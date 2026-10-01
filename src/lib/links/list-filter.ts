import { z } from 'zod';
import type { LinkFilter } from '@/lib/db';

/** Links table / API list filters, read from URL search params. */
const filterSchema = z.object({
  q: z.string().trim().max(200).optional().catch(undefined),
  status: z.enum(['active', 'archived', 'all']).optional().catch(undefined),
  tag: z.string().trim().max(40).optional().catch(undefined),
  folder: z.string().trim().max(64).optional().catch(undefined),
  sort: z.enum(['newest', 'oldest', 'clicks']).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
  limit: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
});

export type ParsedLinkFilter = LinkFilter & { page: number; status: NonNullable<LinkFilter['status']>; sort: NonNullable<LinkFilter['sort']> };

/**
 * Invalid values fall back to defaults instead of erroring, so a hand-edited
 * URL never breaks the page.
 */
export function parseLinkFilter(
  params: Record<string, string | string[] | undefined> | URLSearchParams,
  defaults: { status: 'active' | 'all'; limit: number }
): ParsedLinkFilter {
  const raw = params instanceof URLSearchParams ? Object.fromEntries(params) : Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );
  const f = filterSchema.parse(raw);
  const limit = f.limit ?? defaults.limit;
  const page = f.page ?? 1;
  return {
    q: f.q || undefined,
    status: f.status ?? defaults.status,
    tag: f.tag || undefined,
    folder: f.folder || undefined,
    sort: f.sort ?? 'newest',
    page,
    limit,
    offset: (page - 1) * limit,
  };
}
