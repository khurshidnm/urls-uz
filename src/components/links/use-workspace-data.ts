'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ClientFolder, WorkspaceUsage } from '@/lib/client-types';

/** Plan limits and usage from the server (null until loaded). */
export function useWorkspaceUsage(enabled = true) {
  const [usage, setUsage] = useState<WorkspaceUsage | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/workspace/usage', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setUsage(data);
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch('/api/workspace/usage', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setUsage(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { usage, reload };
}

/** The workspace's folders, fetched once when `initial` isn't provided by the server. */
export function useFolders(initial?: ClientFolder[]) {
  const [folders, setFolders] = useState<ClientFolder[]>(initial ?? []);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    fetch('/api/folders')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setFolders(data.folders);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initial]);

  return { folders, setFolders };
}

/** Remaining quota for a feature; `current` is true when this link already uses it. */
export function quotaState(used: number | undefined, limit: number | null | undefined, current = false) {
  if (limit === null || limit === undefined || used === undefined) return { reached: false, label: '∞' };
  const effectiveUsed = current ? used - 1 : used;
  return { reached: !current && effectiveUsed >= limit, label: `${Math.max(used, 0)}/${limit}` };
}
