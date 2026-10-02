'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Calendar, FileText, Link2, MapPin, Pencil, Plus, QrCode, Search, Trash2, UserCheck, Wifi, Zap } from 'lucide-react';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/lib/language-context';
import { designFrom } from '@/components/qr-studio/qr-design';
import { describeContent, staticPayload } from '@/lib/qr/content';
import { formatDate, formatNumber, shortUrl } from '@/lib/utils';
import type { ClientQrCode } from '@/lib/client-types';
import type { QrDataType } from '@/lib/qr-payloads';

const TYPE_META: Record<QrDataType, { label: [uz: string, ru: string, en: string]; icon: React.ElementType }> = {
  url: { label: ['Havola', 'Ссылка', 'Link'], icon: Link2 },
  vcard: { label: ['vCard', 'vCard', 'vCard'], icon: UserCheck },
  location: { label: ['Joylashuv', 'Локация', 'Location'], icon: MapPin },
  event: { label: ['Tadbir', 'Событие', 'Event'], icon: Calendar },
  text: { label: ['Matn', 'Текст', 'Text'], icon: FileText },
  wifi: { label: ['Wi-Fi', 'Wi-Fi', 'Wi-Fi'], icon: Wifi },
};

interface Props {
  qrCodes: ClientQrCode[];
  canWrite: boolean;
}

/** Saved QR codes: open one to edit it, see its scans, or delete it. */
export default function QrLibrary({ qrCodes: initial, canWrite }: Props) {
  const { showToast } = useToast();
  const { tr } = useLanguage();
  const [qrCodes, setQrCodes] = useState(initial);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<QrDataType | 'all'>('all');
  // Two-step delete: the first click arms the button for a few seconds
  const [armedDelete, setArmedDelete] = useState<string | null>(null);

  const counts = useMemo(() => {
    const byType = new Map<QrDataType, number>();
    for (const qr of qrCodes) byType.set(qr.type, (byType.get(qr.type) ?? 0) + 1);
    return byType;
  }, [qrCodes]);

  const visible = qrCodes.filter((qr) => {
    if (type !== 'all' && qr.type !== type) return false;
    const q = query.trim().toLowerCase();
    return !q || qr.name.toLowerCase().includes(q) || describeContent(qr.type, qr.content).toLowerCase().includes(q);
  });

  const remove = async (qr: ClientQrCode) => {
    if (!canWrite) {
      window.dispatchEvent(new CustomEvent('open-demo-restriction', { detail: { actionTitle: tr('QR kodni o‘chirish', 'Удаление QR-кода', 'Deleting a QR code') } }));
      return;
    }
    if (armedDelete !== qr.id) {
      setArmedDelete(qr.id);
      setTimeout(() => setArmedDelete((current) => (current === qr.id ? null : current)), 3000);
      return;
    }
    setArmedDelete(null);
    try {
      const res = await fetch(`/api/qr-codes/${qr.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        showToast('error', data.error || tr('O‘chirib bo‘lmadi', 'Не удалось удалить', 'Couldn’t delete'));
        return;
      }
      setQrCodes((all) => all.filter((x) => x.id !== qr.id));
      showToast('success', tr('QR kod o‘chirildi', 'QR-код удалён', 'QR code deleted'));
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    }
  };

  const chip = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors ${
      active ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
    }`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-400" />
            <span>{tr('QR kodlarim', 'Мои QR-коды', 'My QR codes')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {tr('Saqlangan QR kodlar. Dinamik QR kodlarning ma’lumotini chop etilgandan keyin ham o‘zgartirishingiz mumkin.', 'Сохранённые QR-коды. Данные динамических QR-кодов можно менять даже после печати.', 'Your saved QR codes. Dynamic QR codes can be edited even after they’re printed.')}
          </p>
        </div>
        <Link
          href="/dashboard/qr/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shrink-0"
        >
          <Plus className="w-4 h-4" /> {tr('Yangi QR kod', 'Новый QR-код', 'New QR code')}
        </Link>
      </div>

      {qrCodes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative md:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr('Nomi yoki tarkibi bo‘yicha qidirish', 'Поиск по названию или содержимому', 'Search by name or content')}
                aria-label={tr('QR kodlarni qidirish', 'Поиск QR-кодов', 'Search QR codes')}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button type="button" onClick={() => setType('all')} className={chip(type === 'all')}>
                {tr('Barchasi', 'Все', 'All')} <span className="text-zinc-500 font-mono">{qrCodes.length}</span>
              </button>
              {(Object.keys(TYPE_META) as QrDataType[])
                .filter((t) => counts.has(t))
                .map((t) => {
                  const Icon = TYPE_META[t].icon;
                  return (
                    <button key={t} type="button" onClick={() => setType(t)} className={chip(type === t)}>
                      <Icon className="w-3.5 h-3.5 text-indigo-400" /> {tr(...TYPE_META[t].label)}
                      <span className="text-zinc-500 font-mono">{counts.get(t)}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="py-16 text-center text-xs text-zinc-500">{tr('Hech narsa topilmadi.', 'Ничего не найдено.', 'Nothing found.')}</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.map((qr) => (
                <QrCard key={qr.id} qr={qr} armed={armedDelete === qr.id} canWrite={canWrite} onDelete={() => remove(qr)} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function QrCard({ qr, armed, canWrite, onDelete }: { qr: ClientQrCode; armed: boolean; canWrite: boolean; onDelete: () => void }) {
  const { tr, locale } = useLanguage();
  const meta = TYPE_META[qr.type];
  const Icon = meta.icon;
  const payload = qr.link ? shortUrl(qr.link.slug) : staticPayload(qr.type, qr.content);
  const design = designFrom(qr.design);
  const summary = describeContent(qr.type, qr.content);

  return (
    <li className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col group">
      <Link href={`/dashboard/qr/${qr.id}`} className="flex justify-center p-4 bg-zinc-900/50 border-b border-zinc-800" aria-label={tr(`${qr.name} tahrirlash`, `Редактировать ${qr.name}`, `Edit ${qr.name}`)}>
        <QrCanvas value={payload} size={132} {...design} errorLevel={payload.length > 200 ? 'M' : design.errorLevel} showControls={false} />
      </Link>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dashboard/qr/${qr.id}`} className="font-semibold text-white text-sm hover:text-indigo-300 transition-colors break-words min-w-0">
            {qr.name}
          </Link>
          {qr.link ? (
            <Badge variant="success" size="xs" icon={<Zap className="w-3 h-3" />}>
              {tr('Dinamik', 'Динамический', 'Dynamic')}
            </Badge>
          ) : (
            <Badge variant="default" size="xs">
              {tr('Statik', 'Статический', 'Static')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 min-w-0">
          <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="shrink-0">{tr(...meta.label)}</span>
          {summary && <span className="truncate" title={summary}>· {summary}</span>}
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          {qr.link ? (
            <Link href={`/dashboard/links/${qr.link.id}`} className="flex items-center gap-1 hover:text-zinc-300" title={tr('Statistika', 'Статистика', 'Stats')}>
              <BarChart3 className="w-3 h-3" /> {formatNumber(qr.link.click_count)} {tr('skan', 'скан.', 'scans')}
            </Link>
          ) : (
            <span>—</span>
          )}
          <span>{formatDate(qr.updated_at, locale)}</span>
        </div>
        <div className="flex items-center gap-1.5 pt-1">
          <Link
            href={`/dashboard/qr/${qr.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-medium"
          >
            <Pencil className="w-3 h-3" /> {tr('Tahrirlash', 'Изменить', 'Edit')}
          </Link>
          {canWrite && (
            <button
              type="button"
              onClick={onDelete}
              title={qr.link ? tr('O‘chirish: chop etilgan nusxalar ishlamay qoladi', 'Удалить: напечатанные копии перестанут работать', 'Delete: printed copies will stop working') : tr('O‘chirish', 'Удалить', 'Delete')}
              className={
                armed
                  ? 'flex items-center gap-1 px-2 py-1.5 rounded-md bg-rose-600 text-white text-[11px] font-semibold'
                  : 'p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-colors'
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
              {armed && <span>{tr('Tasdiqlash', 'Подтвердить', 'Confirm')}</span>}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyState() {
  const { tr } = useLanguage();
  const starters: { type: QrDataType; text: string }[] = [
    { type: 'vcard', text: tr('Vizitka: kontakt ma’lumotlari o‘zgarsa ham QR eskirmaydi', 'Визитка: QR не устареет, даже если контакты изменятся', 'Business card: the QR stays valid when your details change') },
    { type: 'url', text: tr('Sayt, menyu yoki aksiya sahifasi uchun', 'Для сайта, меню или акции', 'For a website, menu or promo page') },
    { type: 'wifi', text: tr('Mehmonlar uchun Wi-Fi ulanishi', 'Wi-Fi для гостей', 'Guest Wi-Fi access') },
  ];
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center space-y-5">
      <QrCode className="w-10 h-10 text-zinc-600 mx-auto" />
      <div>
        <h2 className="text-sm font-semibold text-white">{tr('Hali saqlangan QR kod yo‘q', 'Сохранённых QR-кодов пока нет', 'No saved QR codes yet')}</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
          {tr('QR kod yarating va saqlang — keyin istalgan vaqt ochib tahrirlaysiz. Dinamik QR kodlar chop etilgandan keyin ham yangilanadi.', 'Создайте и сохраните QR-код — потом его можно открыть и отредактировать. Динамические QR-коды обновляются даже после печати.', 'Create and save a QR code, then open and edit it any time. Dynamic QR codes update even after they’re printed.')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {starters.map(({ type, text }) => {
          const Icon = TYPE_META[type].icon;
          return (
            <Link
              key={type}
              href={`/dashboard/qr/new?type=${type}`}
              className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-left transition-colors"
            >
              <Icon className="w-4 h-4 text-indigo-400" />
              <div className="mt-2 text-xs font-semibold text-white">{tr(...TYPE_META[type].label)}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{text}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
