'use client';

import React, { useState } from 'react';
import { Archive, ArchiveRestore, Download, FolderInput, Loader2, Tag, Trash2, X } from 'lucide-react';
import type { ClientFolder } from '@/lib/client-types';
import { useLanguage } from '@/lib/language-context';

export type BulkRequest =
  | { action: 'archive' | 'unarchive' | 'delete' }
  | { action: 'move'; folder_id: string | null }
  | { action: 'add_tag' | 'remove_tag'; tag: string };

interface Props {
  count: number;
  folders: ClientFolder[];
  busy: boolean;
  onRun: (request: BulkRequest) => void;
  onExport: () => void;
  onClear: () => void;
}

const button = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-40';

/** Actions for the selected links; appears while anything is selected. */
export default function BulkBar({ count, folders, busy, onRun, onExport, onClear }: Props) {
  const { tr } = useLanguage();
  const [panel, setPanel] = useState<'none' | 'tag' | 'move' | 'delete'>('none');
  const [tag, setTag] = useState('');

  return (
    <div
      role="toolbar"
      aria-label={tr('Tanlangan havolalar amallari', 'Действия с выбранными ссылками', 'Actions for selected links')}
      className="sticky top-0 z-20 p-2.5 rounded-2xl bg-zinc-900/95 backdrop-blur border border-indigo-500/30 shadow-lg shadow-black/30 space-y-2"
    >
      <div className="flex items-center gap-1 flex-wrap">
        <span className="px-2 text-xs font-semibold text-indigo-300 font-mono">{tr(`${count} ta tanlandi`, `Выбрано: ${count}`, `${count} selected`)}</span>
        <span className="w-px h-5 bg-zinc-700 mx-1" />
        <button type="button" disabled={busy} className={button} onClick={() => onRun({ action: 'archive' })}>
          <Archive className="w-3.5 h-3.5" /> {tr('Arxivlash', 'В архив', 'Archive')}
        </button>
        <button type="button" disabled={busy} className={button} onClick={() => onRun({ action: 'unarchive' })}>
          <ArchiveRestore className="w-3.5 h-3.5" /> {tr('Arxivdan chiqarish', 'Из архива', 'Unarchive')}
        </button>
        <button type="button" disabled={busy} className={button} onClick={() => setPanel(panel === 'tag' ? 'none' : 'tag')}>
          <Tag className="w-3.5 h-3.5" /> {tr('Teg', 'Тег', 'Tag')}
        </button>
        <button type="button" disabled={busy} className={button} onClick={() => setPanel(panel === 'move' ? 'none' : 'move')}>
          <FolderInput className="w-3.5 h-3.5" /> {tr('Papkaga', 'В папку', 'Move')}
        </button>
        <button type="button" disabled={busy} className={button} onClick={onExport}>
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
        <button type="button" disabled={busy} className={`${button} text-rose-300 hover:text-rose-200`} onClick={() => setPanel(panel === 'delete' ? 'none' : 'delete')}>
          <Trash2 className="w-3.5 h-3.5" /> {tr('O‘chirish', 'Удалить', 'Delete')}
        </button>
        <div className="flex-1" />
        {busy && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
        <button type="button" onClick={onClear} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800" title={tr('Tanlovni bekor qilish', 'Снять выделение', 'Clear selection')}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {panel === 'tag' && (
        <form
          className="flex items-center gap-2 px-2 pb-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!tag.trim()) return;
            onRun({ action: 'add_tag', tag: tag.trim() });
            setTag('');
            setPanel('none');
          }}
        >
          <input
            autoFocus
            value={tag}
            maxLength={40}
            onChange={(e) => setTag(e.target.value.replace(/,/g, ''))}
            placeholder={tr('teg nomi', 'название тега', 'tag name')}
            className="w-44 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold">{tr('Qo‘shish', 'Добавить', 'Add')}</button>
          <button
            type="button"
            onClick={() => {
              if (!tag.trim()) return;
              onRun({ action: 'remove_tag', tag: tag.trim() });
              setTag('');
              setPanel('none');
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs"
          >
            {tr('Olib tashlash', 'Убрать', 'Remove')}
          </button>
        </form>
      )}

      {panel === 'move' && (
        <div className="flex items-center gap-2 px-2 pb-1 flex-wrap">
          <span className="text-xs text-zinc-400">{tr('Qaysi papkaga:', 'В какую папку:', 'Move to:')}</span>
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                onRun({ action: 'move', folder_id: f.id });
                setPanel('none');
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200"
            >
              {f.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onRun({ action: 'move', folder_id: null });
              setPanel('none');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400"
          >
            {tr('Papkadan chiqarish', 'Убрать из папки', 'Remove from folder')}
          </button>
          {folders.length === 0 && <span className="text-xs text-zinc-500">{tr('Avval papka yarating.', 'Сначала создайте папку.', 'Create a folder first.')}</span>}
        </div>
      )}

      {panel === 'delete' && (
        <div className="flex items-center gap-2 px-2 pb-1 text-xs">
          <span className="text-rose-300">{tr(`${count} ta havola butunlay o‘chiriladi: statistika va tarix ham. Qaytarib bo‘lmaydi.`, `Ссылки (${count}) будут удалены навсегда вместе со статистикой и историей. Это необратимо.`, `${count} links will be deleted for good, with their stats and history. This can’t be undone.`)}</span>
          <button
            type="button"
            onClick={() => {
              onRun({ action: 'delete' });
              setPanel('none');
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
          >
            {tr('Ha, o‘chirish', 'Да, удалить', 'Yes, delete')}
          </button>
          <button type="button" onClick={() => setPanel('none')} className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white">
            {tr('Bekor', 'Отмена', 'Cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
