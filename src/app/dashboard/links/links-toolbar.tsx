'use client';

import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { LinksFilterState } from './types';

interface Props {
  filter: LinksFilterState;
  tags: { tag: string; count: number }[];
  counts: { active: number | null; archived: number };
  onChange: (patch: Partial<LinksFilterState>) => void;
}

const selectClass =
  'px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer';

/** Search, status, tag and sort controls. Changes are applied to the URL by the parent. */
export default function LinksToolbar({ filter, tags, counts, onChange }: Props) {
  const [search, setSearch] = useState(filter.q);

  // Debounce typing so every keystroke doesn't trigger a server round-trip
  useEffect(() => {
    if (search === filter.q) return;
    const timer = setTimeout(() => onChange({ q: search.trim(), page: 1 }), 300);
    return () => clearTimeout(timer);
  }, [search, filter.q, onChange]);

  const statuses: { value: LinksFilterState['status']; label: string }[] = [
    { value: 'active', label: counts.active === null ? 'Faol' : `Faol (${counts.active})` },
    { value: 'archived', label: `Arxiv (${counts.archived})` },
    { value: 'all', label: 'Barchasi' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-2.5">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish: nom, slug, manzil yoki teg..."
          aria-label="Havolalarni qidirish"
          className="w-full pl-10 pr-9 py-2 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl text-white text-xs focus:outline-none placeholder:text-zinc-600"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            aria-label="Qidiruvni tozalash"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 text-xs">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ status: s.value, page: 1 })}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter.status === s.value ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <select value={filter.tag} onChange={(e) => onChange({ tag: e.target.value, page: 1 })} className={selectClass} aria-label="Teg bo‘yicha filtr">
          <option value="">Barcha teglar</option>
          {tags.map((t) => (
            <option key={t.tag} value={t.tag}>
              #{t.tag} ({t.count})
            </option>
          ))}
        </select>

        <select value={filter.sort} onChange={(e) => onChange({ sort: e.target.value as LinksFilterState['sort'], page: 1 })} className={selectClass} aria-label="Saralash">
          <option value="newest">Eng yangilari</option>
          <option value="oldest">Eng eskilari</option>
          <option value="clicks">Ko‘p bosilgan</option>
        </select>
      </div>
    </div>
  );
}
