'use client';

import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Lock } from 'lucide-react';
import { ICON_OPTIONS } from './bio-builder-constants';
import type { BioBuilder } from './use-bio-builder';
import { useLanguage } from '@/lib/language-context';

/** Bio page buttons (each backed by a short link). */
export default function LinksTab({ b }: { b: BioBuilder }) {
  const { tr } = useLanguage();
  const { BIO_LINKS_LIMIT, links, addLink, removeLink, updateLink, moveLink, renderIconComponent } = b;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
            {tr('Havolalar', 'Ссылки', 'Links')} ({links.length}/{BIO_LINKS_LIMIT})
          </h3>
          <p className="text-[11px] text-zinc-500">
            {tr(`Bepul tarifda ko‘pi bilan ${BIO_LINKS_LIMIT} ta tugma qo‘shish mumkin`, `На бесплатном тарифе — до ${BIO_LINKS_LIMIT} кнопок`, `The free plan allows up to ${BIO_LINKS_LIMIT} buttons`)}
          </p>
        </div>
        <button
          type="button"
          onClick={addLink}
          disabled={links.length >= BIO_LINKS_LIMIT}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{links.length >= BIO_LINKS_LIMIT ? tr(`Limit to‘lgan (${BIO_LINKS_LIMIT}/${BIO_LINKS_LIMIT})`, `Лимит исчерпан (${BIO_LINKS_LIMIT}/${BIO_LINKS_LIMIT})`, `Limit reached (${BIO_LINKS_LIMIT}/${BIO_LINKS_LIMIT})`) : tr('Tugma qo‘shish', 'Добавить кнопку', 'Add button')}</span>
        </button>
      </div>

      {/* Limit Alert note */}
      {links.length >= BIO_LINKS_LIMIT && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            {tr(
              'Bepul tarif limiti to‘ldi. Yangi tugma qo‘shish uchun mavjudlarini o‘chiring. Cheksiz tugmalar Pro tarifda tez kunda ishga tushadi!',
              'Лимит бесплатного тарифа исчерпан. Удалите кнопку, чтобы добавить новую. Безлимит скоро появится на тарифе Pro!',
              'You’ve reached the free plan’s limit. Delete a button to add a new one. Unlimited buttons are coming soon with Pro!'
            )}
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
                  {link.title || tr('Nomsiz tugma', 'Без названия', 'Untitled button')}
                </span>
              </div>

              {/* Controls: Up, Down, Delete */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveLink(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                  title={tr('Yuqoriga surish', 'Переместить вверх', 'Move up')}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveLink(idx, 'down')}
                  disabled={idx === links.length - 1}
                  className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                  title={tr('Pastga surish', 'Переместить вниз', 'Move down')}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 ml-1 transition-colors"
                  title={tr('O‘chirish', 'Удалить', 'Delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inputs: Title and URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  {tr('Tugma Matni', 'Текст кнопки', 'Button text')}
                </label>
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => updateLink(idx, 'title', e.target.value)}
                  placeholder={tr('Masalan: Telegram Kanal', 'Например: Telegram-канал', 'e.g. Telegram channel')}
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  {tr('Havola manzili (URL)', 'Адрес ссылки (URL)', 'Link URL')}
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
                  {tr('Ikonka', 'Иконка', 'Icon')}
                </label>
                <select
                  value={link.icon || 'link'}
                  onChange={(e) => updateLink(idx, 'icon', e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none"
                >
                  {ICON_OPTIONS.map((ico) => (
                    <option key={ico.id} value={ico.id}>
                      {tr(ico.label[0], ico.label[1], ico.label[2])}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style selector */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  {tr('Dizayn', 'Дизайн', 'Style')}
                </label>
                <select
                  value={link.style || 'glass'}
                  onChange={(e) => updateLink(idx, 'style', e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 text-xs focus:outline-none"
                >
                  <option value="glass">{tr('Oynaviy (Glass)', 'Стекло', 'Glass')}</option>
                  <option value="solid">{tr('To‘q fon (Solid)', 'Сплошной', 'Solid')}</option>
                </select>
              </div>

              {/* Badge / Tag text */}
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                  {tr('Nishon (Tag)', 'Метка', 'Badge')}
                </label>
                <input
                  type="text"
                  value={link.tag || ''}
                  onChange={(e) => updateLink(idx, 'tag', e.target.value)}
                  placeholder={tr('Yangi / Hot', 'Новинка / Hot', 'New / Hot')}
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
