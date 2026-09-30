/** Current links-table filter, mirrored in the URL. */
export interface LinksFilterState {
  q: string;
  status: 'active' | 'archived' | 'all';
  tag: string;
  /** Folder id, 'none' for unfiled links, '' for all. */
  folder: string;
  sort: 'newest' | 'oldest' | 'clicks';
  page: number;
}

export const DEFAULT_FILTER: LinksFilterState = { q: '', status: 'active', tag: '', folder: '', sort: 'newest', page: 1 };

/** Only non-default values go into the URL. */
export function filterToQuery(filter: LinksFilterState): string {
  const params = new URLSearchParams();
  if (filter.q) params.set('q', filter.q);
  if (filter.status !== DEFAULT_FILTER.status) params.set('status', filter.status);
  if (filter.tag) params.set('tag', filter.tag);
  if (filter.folder) params.set('folder', filter.folder);
  if (filter.sort !== DEFAULT_FILTER.sort) params.set('sort', filter.sort);
  if (filter.page > 1) params.set('page', String(filter.page));
  const query = params.toString();
  return query ? `?${query}` : '';
}
