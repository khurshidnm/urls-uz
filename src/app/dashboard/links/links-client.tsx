'use client';

import React, { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Link2, Plus, SearchX } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { copyToClipboard, shortUrl } from '@/lib/utils';
import type { ClientFolder, ClientLink, WorkspaceUsage } from '@/lib/client-types';
import { filterToQuery, type LinksFilterState } from './types';
import UsageCard from './usage-card';
import FolderBar from './folder-bar';
import LinksToolbar from './links-toolbar';
import LinksTable from './links-table';
import BulkBar, { type BulkRequest } from './bulk-bar';

interface Props {
  links: ClientLink[];
  total: number;
  filter: LinksFilterState;
  pageSize: number;
  folders: ClientFolder[];
  tags: { tag: string; count: number }[];
  archivedCount: number;
  usage: WorkspaceUsage;
  canWrite: boolean;
}

/** Shows the demo sign-up prompt (handled by the dashboard layout). */
function demoRestricted(actionTitle: string) {
  window.dispatchEvent(new CustomEvent('open-demo-restriction', { detail: { actionTitle } }));
}

export default function LinksManagerClient({ links, total, filter, pageSize, folders, tags, archivedCount, usage, canWrite }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // A new page of results from the server clears the selection
  const [prevLinks, setPrevLinks] = useState(links);
  if (links !== prevLinks) {
    setPrevLinks(links);
    setSelected(new Set());
  }

  const navigate = useCallback(
    (patch: Partial<LinksFilterState>) => {
      startTransition(() => router.replace(`/dashboard/links${filterToQuery({ ...filter, ...patch })}`, { scroll: false }));
    },
    [filter, router]
  );

  const refresh = () => startTransition(() => router.refresh());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setSelected((prev) => (links.every((l) => prev.has(l.id)) ? new Set() : new Set(links.map((l) => l.id))));

  const copy = async (link: ClientLink) => {
    const url = shortUrl(link.slug);
    if (await copyToClipboard(url)) {
      setCopiedId(link.id);
      showToast('copied', `${url} nusxalandi!`);
      setTimeout(() => setCopiedId((id) => (id === link.id ? null : id)), 2000);
    }
  };

  const runBulk = async (request: BulkRequest, ids: string[] = [...selected]) => {
    if (!canWrite) return demoRestricted('Havolalarni o‘zgartirish');
    setBusy(true);
    try {
      const res = await fetch('/api/links/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, ids }),
      });
      const data = await res.json();
      if (data.failed?.length) {
        showToast('error', `${data.succeeded.length} ta bajarildi, ${data.failed.length} ta bajarilmadi: ${data.failed[0].error}`);
      } else if (data.success) {
        showToast('success', `${data.succeeded.length} ta havola yangilandi`);
      } else {
        showToast('error', data.error || 'Xatolik yuz berdi');
      }
      setSelected(new Set());
      refresh();
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = links
      .filter((l) => selected.has(l.id))
      .map((l) =>
        [l.title, shortUrl(l.slug), l.destination_url, String(l.click_count), l.tags.join(', '), l.is_archived ? 'Yes' : 'No', l.created_at]
          .map(escape)
          .join(',')
      );
    const csv = ['Title,Short URL,Destination URL,Clicks,Tags,Archived,Created At', ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `urls-uz-links-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('success', `${rows.length} ta havola CSV formatda yuklab olindi`);
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const isFiltered = Boolean(filter.q || filter.tag || filter.folder);
  const openCreate = () => window.dispatchEvent(new Event('open-create-link'));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Mening havolalarim</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {total} ta havola{isFiltered ? ' (filtrlangan)' : ''} · Sarlavhani bosing: analitika, QR, sozlamalar va tarix
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Yangi havola
        </button>
      </div>

      {canWrite && <UsageCard usage={usage} />}

      <FolderBar folders={folders} selected={filter.folder} canWrite={canWrite} onSelect={(folder) => navigate({ folder, page: 1 })} onChanged={refresh} />

      <LinksToolbar
        filter={filter}
        tags={tags}
        counts={{ active: isFiltered ? null : usage.usage.activeLinks, archived: archivedCount }}
        onChange={navigate}
      />

      {selected.size > 0 && (
        <BulkBar count={selected.size} folders={folders} busy={busy} onRun={(r) => runBulk(r)} onExport={exportCsv} onClear={() => setSelected(new Set())} />
      )}

      <div className={`transition-opacity ${pending ? 'opacity-60' : ''}`}>
        {links.length > 0 ? (
          <LinksTable
            links={links}
            folders={folders}
            selected={selected}
            canWrite={canWrite}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onCopy={copy}
            onArchive={(link) => runBulk({ action: link.is_archived ? 'unarchive' : 'archive' }, [link.id])}
            onDelete={(link) => runBulk({ action: 'delete' }, [link.id])}
            onTagClick={(tag) => navigate({ tag, page: 1 })}
            copiedId={copiedId}
          />
        ) : (
          <EmptyState
            kind={isFiltered || filter.status !== 'active' ? 'filtered' : archivedCount > 0 ? 'all-archived' : 'no-links'}
            archivedCount={archivedCount}
            onClear={() => navigate({ q: '', tag: '', folder: '', status: 'active', page: 1 })}
            onShowArchive={() => navigate({ status: 'archived', page: 1 })}
            onCreate={openCreate}
          />
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-mono">
            {(filter.page - 1) * pageSize + 1}–{Math.min(filter.page * pageSize, total)} / {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={filter.page <= 1}
              onClick={() => navigate({ page: filter.page - 1 })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Oldingi
            </button>
            <button
              type="button"
              disabled={filter.page >= pages}
              onClick={() => navigate({ page: filter.page + 1 })}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-40 hover:text-white"
            >
              Keyingi <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  kind,
  archivedCount,
  onClear,
  onShowArchive,
  onCreate,
}: {
  kind: 'filtered' | 'all-archived' | 'no-links';
  archivedCount: number;
  onClear: () => void;
  onShowArchive: () => void;
  onCreate: () => void;
}) {
  const actionClass = 'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold';
  return (
    <div className="p-10 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
        {kind === 'no-links' ? <Link2 className="w-6 h-6" /> : <SearchX className="w-6 h-6" />}
      </div>
      {kind === 'filtered' && (
        <>
          <p className="text-sm font-semibold text-white">Bu filtrga mos havola topilmadi</p>
          <button type="button" onClick={onClear} className="text-xs text-indigo-400 hover:text-indigo-300">
            Filtrlarni tozalash
          </button>
        </>
      )}
      {kind === 'all-archived' && (
        <>
          <p className="text-sm font-semibold text-white">Faol havolalar yo‘q</p>
          <p className="text-xs text-zinc-400">Arxivda {archivedCount} ta havola bor — ular ishlashda davom etadi.</p>
          <button type="button" onClick={onShowArchive} className={actionClass}>
            Arxivni ko‘rish
          </button>
        </>
      )}
      {kind === 'no-links' && (
        <>
          <p className="text-sm font-semibold text-white">Hali havola yo‘q</p>
          <p className="text-xs text-zinc-400">Birinchi qisqa havolangizni yarating — bir necha soniya kifoya.</p>
          <button type="button" onClick={onCreate} className={actionClass}>
            <Plus className="w-3.5 h-3.5" /> Yangi havola
          </button>
        </>
      )}
    </div>
  );
}
