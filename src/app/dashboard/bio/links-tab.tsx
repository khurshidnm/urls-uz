'use client';

import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Lock } from 'lucide-react';
import { ICON_OPTIONS } from './bio-builder-constants';
import type { BioBuilder } from './use-bio-builder';

/** Bio page buttons (each backed by a short link). */
export default function LinksTab({ b }: { b: BioBuilder }) {
  const { BIO_LINKS_LIMIT, links, addLink, removeLink, updateLink, moveLink, renderIconComponent } = b;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
            Havolalar ({links.length}/{BIO_LINKS_LIMIT} ta)
          </h3>
          <p className="text-[11px] text-zinc-500">
            Bepul tarifda ko‘pi bilan 4 ta tugma qo‘shish mumkin
          </p>
        </div>
        <button
          type="button"
          onClick={addLink}
          disabled={links.length >= BIO_LINKS_LIMIT}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{links.length >= BIO_LINKS_LIMIT ? 'Limit to‘lgan (4/4)' : 'Tugma qo‘shish'}</span>
        </button>
      </div>

      {/* Limit Alert note */}
      {links.length >= BIO_LINKS_LIMIT && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Bepul tarif limiti: 4 / 4 ta tugma qo‘shilgan. Yangi tugma qo‘shish uchun mavjudlarini o‘chiring. Cheksiz tugmalar Pro tarifda tez kunda ishga tushadi!
          </span>
        </div>
      )}

      {/* Links list */}
      <div className="space-y-3">
        {links.map((link, idx) => (
          <div
            key={idx}
            className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3 relative group transition-all hover:border-zinc-700"
          >
            {/* Header bar of link item */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500">#{idx + 1}</span>
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center">
                  {renderIconComponent(link.icon)}
                </div>
                <span className="text-xs font-medium text-white truncate max-w-[140px]">
                  {link.title || 'Nomsiz tugma'}
                </span>
              </div>

              {/* Controls: Up, Down, Delete */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveLink(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                  title="Yuqoriga surish"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveLink(idx, 'down')}
                  disabled={idx === links.length - 1}
                  className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                  title="Pastga surish"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 ml-1 transition-colors"
                  title="O‘chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inputs: Title and URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  Tugma Matni
                </label>
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => updateLink(idx, 'title', e.target.value)}
                  placeholder="Masalan: Telegram Kanal"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  Havola Manzili (URL)
                </label>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink(idx, 'url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Icon & Style Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {/* Icon selector */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  Ikonka
                </label>
                <select
                  value={link.icon || 'link'}
                  onChange={(e) => updateLink(idx, 'icon', e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none"
                >
                  {ICON_OPTIONS.map((ico) => (
                    <option key={ico.id} value={ico.id}>
                      {ico.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style selector */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  Dizayn
                </label>
                <select
                  value={link.style || 'glass'}
                  onChange={(e) => updateLink(idx, 'style', e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none"
                >
                  <option value="glass">Oynaviy (Glass)</option>
                  <option value="solid">To‘q fon (Solid)</option>
                </select>
              </div>

              {/* Badge / Tag text */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  Nishon (Tag)
                </label>
                <input
                  type="text"
                  value={link.tag || ''}
                  onChange={(e) => updateLink(idx, 'tag', e.target.value)}
                  placeholder="Yangi / Hot"
                  className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
