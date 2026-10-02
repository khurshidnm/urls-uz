'use client';

import React, { useState } from 'react';
import { Check, FolderOpen, FolderPlus, Pencil, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/lib/language-context';
import type { ClientFolder } from '@/lib/client-types';

interface Props {
  folders: ClientFolder[];
  selected: string;
  canWrite: boolean;
  onSelect: (folder: string) => void;
  /** Called after a folder is created, renamed or deleted, to reload server data. */
  onChanged: () => void;
}

const chip = (active: boolean) =>
  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
    active ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
  }`;

/** Folder filter chips plus create / rename / delete for the selected folder. */
export default function FolderBar({ folders, selected, canWrite, onSelect, onChanged }: Props) {
  const { showToast } = useToast();
  const { tr } = useLanguage();
  const [mode, setMode] = useState<'idle' | 'create' | 'rename' | 'delete'>('idle');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const current = folders.find((f) => f.id === selected);

  const request = async (url: string, method: string, body?: unknown) => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.success) {
        showToast('error', data.error || 'Xatolik yuz berdi');
        return null;
      }
      setMode('idle');
      setName('');
      onChanged();
      return data;
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const submitName = async () => {
    if (!name.trim()) return;
    if (mode === 'create') {
      const data = await request('/api/folders', 'POST', { name: name.trim() });
      if (data) onSelect(data.folder.id);
    } else if (mode === 'rename' && current) {
      await request(`/api/folders/${current.id}`, 'PATCH', { name: name.trim() });
    }
  };

  const remove = async () => {
    if (!current) return;
    if (await request(`/api/folders/${current.id}`, 'DELETE')) {
      showToast('info', tr(`"${current.name}" papkasi o‘chirildi, havolalar saqlanib qoldi`, `Папка «${current.name}» удалена, ссылки сохранены`, `Folder "${current.name}" deleted; its links were kept`));
      onSelect('');
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <FolderOpen className="w-4 h-4 text-zinc-500 shrink-0" />
      <button type="button" className={chip(selected === '')} onClick={() => onSelect('')}>
        {tr('Barcha papkalar', 'Все папки', 'All folders')}
      </button>
      {folders.map((f) => (
        <button key={f.id} type="button" className={chip(selected === f.id)} onClick={() => onSelect(f.id)}>
          {f.name}
          <span className="text-[10px] font-mono text-zinc-500">{f.link_count}</span>
        </button>
      ))}
      {folders.length > 0 && (
        <button type="button" className={chip(selected === 'none')} onClick={() => onSelect('none')}>
          {tr('Papkasiz', 'Без папки', 'No folder')}
        </button>
      )}

      {canWrite && mode === 'idle' && (
        <>
          <button
            type="button"
            onClick={() => setMode('create')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white border border-dashed border-zinc-700 whitespace-nowrap"
          >
            <FolderPlus className="w-3.5 h-3.5" /> {tr('Papka', 'Папка', 'Folder')}
          </button>
          {current && (
            <>
              <button
                type="button"
                title={tr('Papka nomini o‘zgartirish', 'Переименовать папку', 'Rename folder')}
                onClick={() => {
                  setName(current.name);
                  setMode('rename');
                }}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button type="button" title={tr('Papkani o‘chirish', 'Удалить папку', 'Delete folder')} onClick={() => setMode('delete')} className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </>
      )}

      {(mode === 'create' || mode === 'rename') && (
        <form
          className="flex items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            submitName();
          }}
        >
          <input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setMode('idle')}
            placeholder={tr('Papka nomi', 'Название папки', 'Folder name')}
            className="w-40 px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" disabled={busy || !name.trim()} className="p-1.5 rounded-lg text-emerald-400 hover:bg-zinc-800 disabled:opacity-40" title={tr('Saqlash', 'Сохранить', 'Save')}>
            <Check className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => setMode('idle')} className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800" title={tr('Bekor qilish', 'Отмена', 'Cancel')}>
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {mode === 'delete' && current && (
        <div className="flex items-center gap-2 text-xs whitespace-nowrap">
          <span className="text-zinc-400">{tr(`«${current.name}» o‘chirilsinmi? Havolalar saqlanadi.`, `Удалить «${current.name}»? Ссылки сохранятся.`, `Delete "${current.name}"? Its links are kept.`)}</span>
          <button type="button" disabled={busy} onClick={remove} className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold">
            {tr('O‘chirish', 'Удалить', 'Delete')}
          </button>
          <button type="button" onClick={() => setMode('idle')} className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white">
            {tr('Bekor', 'Отмена', 'Cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
