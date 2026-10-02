'use client';

import React, { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Sparkles } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { ClientFolder, LinkEvent } from '@/lib/client-types';
import { useLanguage } from '@/lib/language-context';

type Tr = (uz: string, ru: string, en: string) => string;

const FIELD_LABELS: Record<string, [uz: string, ru: string, en: string]> = {
  title: ['Sarlavha', 'Название', 'Title'],
  destination_url: ['Manzil', 'Адрес', 'Destination'],
  slug: ['Qisqa nom', 'Короткий адрес', 'Slug'],
  is_active: ['Faol', 'Активна', 'Active'],
  is_archived: ['Arxivlangan', 'В архиве', 'Archived'],
  tags: ['Teglar', 'Теги', 'Tags'],
  folder_id: ['Papka', 'Папка', 'Folder'],
  password: ['Parol', 'Пароль', 'Password'],
  expires_at: ['Amal qilish muddati', 'Срок действия', 'Expiry date'],
  click_limit: ['Bosishlar limiti', 'Лимит переходов', 'Click limit'],
  utm_source: ['utm_source', 'utm_source', 'utm_source'],
  utm_medium: ['utm_medium', 'utm_medium', 'utm_medium'],
  utm_campaign: ['utm_campaign', 'utm_campaign', 'utm_campaign'],
  utm_term: ['utm_term', 'utm_term', 'utm_term'],
  utm_content: ['utm_content', 'utm_content', 'utm_content'],
  ios_url: ['iOS havolasi', 'Ссылка для iOS', 'iOS link'],
  android_url: ['Android havolasi', 'Ссылка для Android', 'Android link'],
  huawei_url: ['Huawei havolasi', 'Ссылка для Huawei', 'Huawei link'],
  desktop_url: ['Kompyuter havolasi', 'Ссылка для компьютера', 'Desktop link'],
  open_in_app: ['Smart Deep Link', 'Smart Deep Link', 'Smart Deep Link'],
  qr_config: ['QR dizayn', 'Дизайн QR', 'QR design'],
};

const ACTIONS: Record<LinkEvent['action'], { label: [uz: string, ru: string, en: string]; icon: React.ReactNode; color: string }> = {
  created: { label: ['Havola yaratildi', 'Ссылка создана', 'Link created'], icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  updated: { label: ['Tahrirlandi', 'Изменена', 'Edited'], icon: <Pencil className="w-3.5 h-3.5" />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  archived: { label: ['Arxivlandi', 'В архиве', 'Archived'], icon: <Archive className="w-3.5 h-3.5" />, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  unarchived: { label: ['Arxivdan chiqarildi', 'Возвращена из архива', 'Unarchived'], icon: <ArchiveRestore className="w-3.5 h-3.5" />, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
};

function describe(field: string, value: unknown, folders: ClientFolder[], tr: Tr): string {
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'password') return value === 'set' ? tr('o‘rnatilgan', 'задан', 'set') : '—';
  if (field === 'folder_id') return folders.find((f) => f.id === value)?.name ?? tr('o‘chirilgan papka', 'удалённая папка', 'deleted folder');
  if (field === 'expires_at') return formatDateTime(String(value));
  if (typeof value === 'boolean') return value ? tr('Ha', 'Да', 'Yes') : tr('Yo‘q', 'Нет', 'No');
  if (Array.isArray(value)) return value.length ? value.map((t) => `#${t}`).join(' ') : '—';
  if (typeof value === 'object') return tr('o‘zgartirildi', 'изменено', 'changed');
  return String(value);
}

export default function HistoryTab({ linkId, initialEvents, folders }: { linkId: string; initialEvents: LinkEvent[]; folders: ClientFolder[] }) {
  const { tr } = useLanguage();
  const [events, setEvents] = useState(initialEvents);

  // Pick up changes made in other tabs since the page loaded
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/links/${linkId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setEvents(data.events);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  if (events.length === 0) {
    return <div className="p-8 text-center text-xs text-zinc-500 font-mono rounded-2xl border border-zinc-800">{tr('Hali o‘zgarishlar tarixi yo‘q', 'Истории изменений пока нет', 'No change history yet')}</div>;
  }

  return (
    <ol className="relative space-y-3 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-800">
      {events.map((event) => {
        const meta = ACTIONS[event.action];
        const fields = Object.entries(event.changes);
        return (
          <li key={event.id} className="relative flex gap-3">
            <div className={`relative z-10 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${meta.color}`}>{meta.icon}</div>
            <div className="flex-1 min-w-0 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-white">{tr(...meta.label)}</span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {event.user?.name ?? tr('Tizim', 'Система', 'System')} · {formatDateTime(event.created_at)}
                </span>
              </div>
              {event.action === 'updated' && fields.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {fields.map(([field, change]) => (
                    <li key={field} className="text-[11px] font-mono text-zinc-400 break-all">
                      <span className="text-zinc-300">{FIELD_LABELS[field] ? tr(...FIELD_LABELS[field]) : field}:</span>{' '}
                      {field === 'qr_config' ? (
                        <span>{tr('o‘zgartirildi', 'изменено', 'changed')}</span>
                      ) : (
                        <>
                          <span className="line-through text-zinc-600">{describe(field, change.from, folders, tr)}</span>
                          {' → '}
                          <span className="text-zinc-200">{describe(field, change.to, folders, tr)}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
