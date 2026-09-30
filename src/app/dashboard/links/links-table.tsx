'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Archive, ArchiveRestore, Check, Copy, Lock, QrCode, Smartphone, Target, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatNumber, shortUrl } from '@/lib/utils';
import type { ClientFolder, ClientLink } from '@/lib/client-types';

interface Props {
  links: ClientLink[];
  folders: ClientFolder[];
  selected: Set<string>;
  canWrite: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onCopy: (link: ClientLink) => void;
  onArchive: (link: ClientLink) => void;
  onDelete: (link: ClientLink) => void;
  onTagClick: (tag: string) => void;
  copiedId: string | null;
}

const iconButton = 'p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors';

export default function LinksTable({
  links,
  folders,
  selected,
  canWrite,
  onToggle,
  onToggleAll,
  onCopy,
  onArchive,
  onDelete,
  onTagClick,
  copiedId,
}: Props) {
  // Two-step delete: the first click arms the button for a few seconds
  const [armedDelete, setArmedDelete] = useState<string | null>(null);
  const folderName = (id: string | null) => folders.find((f) => f.id === id)?.name;
  const allSelected = links.length > 0 && links.every((l) => selected.has(l.id));

  const requestDelete = (link: ClientLink) => {
    if (armedDelete === link.id) {
      setArmedDelete(null);
      onDelete(link);
      return;
    }
    setArmedDelete(link.id);
    setTimeout(() => setArmedDelete((current) => (current === link.id ? null : current)), 3000);
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] font-mono uppercase text-zinc-500 border-b border-zinc-800">
          <tr>
            <th className="w-10 py-3 pl-4">
              <input type="checkbox" checked={allSelected} onChange={onToggleAll} aria-label="Barchasini tanlash" disabled={!canWrite} />
            </th>
            <th className="py-3 px-3">Havola</th>
            <th className="py-3 px-3 hidden md:table-cell">Teglar</th>
            <th className="py-3 px-3 text-right">Bosishlar</th>
            <th className="py-3 px-3 hidden lg:table-cell">Yaratilgan</th>
            <th className="py-3 pr-4 text-right">Amallar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-850">
          {links.map((link) => {
            const url = shortUrl(link.slug);
            const folder = folderName(link.folder_id);
            const deviceTargeted = Boolean(link.ios_url || link.android_url || link.huawei_url || link.desktop_url);
            return (
              <tr key={link.id} className={`group hover:bg-zinc-900/40 transition-colors ${selected.has(link.id) ? 'bg-indigo-500/5' : ''} ${link.is_archived || !link.is_active ? 'opacity-60' : ''}`}>
                <td className="py-3 pl-4 align-top pt-4">
                  <input type="checkbox" checked={selected.has(link.id)} onChange={() => onToggle(link.id)} aria-label={`${link.title} tanlash`} disabled={!canWrite} />
                </td>
                <td className="py-3 px-3 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/dashboard/links/${link.id}`} className="font-semibold text-white text-sm hover:text-indigo-300 transition-colors">
                      {link.title}
                    </Link>
                    {link.source === 'bio' && <Badge variant="indigo" size="xs">Bio tugma</Badge>}
                    {link.source === 'qr' && <Badge variant="indigo" size="xs" icon={<QrCode className="w-3 h-3" />}>QR kod</Badge>}
                    {link.open_in_app && <Badge variant="cyan" size="xs" icon={<Smartphone className="w-3 h-3" />}>Deep Link</Badge>}
                    {deviceTargeted && <Badge variant="purple" size="xs" icon={<Target className="w-3 h-3" />}>Qurilmalar</Badge>}
                    {link.has_password && <Badge variant="warning" size="xs" icon={<Lock className="w-3 h-3" />}>Parolli</Badge>}
                    {link.is_archived && <Badge variant="warning" size="xs">Arxivlangan</Badge>}
                    {!link.is_active && <Badge variant="danger" size="xs">O‘chirilgan</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 font-mono text-[11px] min-w-0">
                    <span className="text-indigo-400 font-semibold shrink-0">{url.replace(/^https?:\/\//, '')}</span>
                    <span className="text-zinc-600 truncate max-w-[280px]" title={link.destination_url}>→ {link.destination_url}</span>
                  </div>
                  {folder && <div className="mt-1 text-[10px] text-zinc-500">📁 {folder}</div>}
                </td>
                <td className="py-3 px-3 hidden md:table-cell align-top pt-4">
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {link.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onTagClick(tag)}
                        className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-mono"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3 text-right align-top pt-4">
                  <Link href={`/dashboard/links/${link.id}`} className="font-mono font-semibold text-zinc-200 hover:text-indigo-300 tabular-nums">
                    {formatNumber(link.click_count)}
                  </Link>
                </td>
                <td className="py-3 px-3 hidden lg:table-cell text-zinc-500 font-mono text-[11px] align-top pt-4 whitespace-nowrap">
                  {formatDate(link.created_at)}
                </td>
                <td className="py-3 pr-4 align-top pt-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onCopy(link)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium font-mono transition-all active:scale-95 ${
                        copiedId === link.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-white hover:bg-zinc-200 text-zinc-950'
                      }`}
                      title="Qisqa havolani nusxalash"
                    >
                      {copiedId === link.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedId === link.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <Link href={`/dashboard/links/${link.id}?tab=qr`} className={iconButton} title="QR kod">
                      <QrCode className="w-3.5 h-3.5" />
                    </Link>
                    {canWrite && (
                      <>
                        <button type="button" onClick={() => onArchive(link)} className={iconButton} title={link.is_archived ? 'Arxivdan chiqarish' : 'Arxivlash'}>
                          {link.is_archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(link)}
                          className={
                            armedDelete === link.id
                              ? 'flex items-center gap-1 px-2 py-1.5 rounded-md bg-rose-600 text-white text-[11px] font-semibold'
                              : `${iconButton} hover:text-rose-400`
                          }
                          title="O‘chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {armedDelete === link.id && <span>Tasdiqlash</span>}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
