'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, Check, Info, LayoutGrid, Loader2, Lock, Save, Zap } from 'lucide-react';
import { formatNumber, shortUrl } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

export interface SavePanelProps {
  name: string;
  onNameChange: (name: string) => void;
  namePlaceholder: string;
  dynamic: boolean;
  onDynamicChange: (dynamic: boolean) => void;
  /** The content type supports dynamic QR codes (everything but Wi-Fi). */
  dynamicAllowed: boolean;
  /** The saved QR code already has a short link. */
  link: { id: string; slug: string; click_count: number } | null;
  /** Dynamic was chosen, but the QR still shows the static content until it's saved. */
  pendingDynamic: boolean;
  isSaved: boolean;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  guest: boolean;
}

/** Name, static/dynamic choice and the save button under the QR preview. */
export default function SavePanel(props: SavePanelProps) {
  const { tr } = useLanguage();
  const { name, onNameChange, namePlaceholder, dynamic, onDynamicChange, dynamicAllowed, link, isSaved, dirty, saving, onSave, guest } = props;
  const option = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
      active ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
    }`;
  const label = guest
    ? tr('Ro‘yxatdan o‘tib saqlash', 'Зарегистрироваться и сохранить', 'Sign up to save')
    : !isSaved
      ? tr('QR kodni saqlash', 'Сохранить QR-код', 'Save QR code')
      : dirty
        ? tr('O‘zgarishlarni saqlash', 'Сохранить изменения', 'Save changes')
        : tr('Saqlangan', 'Сохранено', 'Saved');

  return (
    <div className="w-full mt-3 space-y-3">
      <div>
        <label htmlFor="qr-name" className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
          {tr('QR kod nomi', 'Название QR-кода', 'QR code name')}
        </label>
        <input
          id="qr-name"
          type="text"
          value={name}
          maxLength={100}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={namePlaceholder}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600"
        />
      </div>

      {link ? (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <Lock className="w-3 h-3" /> {tr('Dinamik QR', 'Динамический QR', 'Dynamic QR')}
            </span>
            <Link href={`/dashboard/links/${link.id}`} className="flex items-center gap-1 text-emerald-300/80 hover:text-emerald-200 font-mono">
              <BarChart3 className="w-3 h-3" /> {formatNumber(link.click_count)} {tr('skan', 'скан.', 'scans')}
            </Link>
          </div>
          <p className="text-[11px] text-emerald-100/80 leading-relaxed">
            {tr('QR shu manzilga olib boradi:', 'QR ведёт на', 'The QR points to')}{' '}
            <span className="font-mono">{shortUrl(link.slug).replace(/^https?:\/\//, '')}</span>.{' '}
            {tr(
              'Ma’lumotni istalgan vaqt o‘zgartiring — chop etilgan QR o‘zgarmaydi, lekin yangi ma’lumotni ko‘rsatadi.',
              'Меняйте данные когда угодно — напечатанный QR останется прежним, но покажет новое содержимое.',
              'Change the content any time — the printed QR stays the same but shows the new content.'
            )}
          </p>
        </div>
      ) : dynamicAllowed ? (
        <div className="space-y-2">
          <div className="flex gap-2" role="radiogroup" aria-label={tr('QR turi', 'Тип QR', 'QR type')}>
            <button type="button" role="radio" aria-checked={dynamic} onClick={() => onDynamicChange(true)} className={option(dynamic)}>
              <Zap className="w-3 h-3" /> {tr('Dinamik', 'Динамический', 'Dynamic')}
            </button>
            <button type="button" role="radio" aria-checked={!dynamic} onClick={() => onDynamicChange(false)} className={option(!dynamic)}>
              {tr('Statik', 'Статический', 'Static')}
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {dynamic
              ? tr('QR qisqa havolani saqlaydi: ma’lumotni keyin o‘zgartirsangiz, chop etilgan QR ham yangi ma’lumotni ko‘rsatadi. Skanerlar hisoblanadi.', 'QR хранит короткую ссылку: если позже изменить данные, напечатанный QR покажет новые. Сканирования считаются.', 'The QR holds a short link: change the content later and the printed QR shows the new version. Scans are counted.')
              : tr('Ma’lumot QR ichiga yoziladi va internet talab qilmaydi. Keyin tahrirlashingiz mumkin, lekin chop etilgan nusxa eskicha qoladi.', 'Данные записываются прямо в QR и не требуют интернета. Редактировать можно, но напечатанная копия останется прежней.', 'The content is written into the QR and needs no internet. You can edit it later, but printed copies stay as they were.')}
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
          <span>{tr('Wi-Fi QR faqat statik bo‘ladi: telefon tarmoqqa QR ichidagi ma’lumot bilan ulanadi. Saqlab, keyin tahrirlashingiz mumkin.', 'Wi-Fi QR всегда статический: телефон подключается по данным внутри QR. Его можно сохранить и редактировать позже.', 'Wi-Fi QR codes are always static: the phone connects using the details inside the QR. You can save it and edit it later.')}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving || (isSaved && !dirty)}
        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved && !dirty ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {label}
      </button>

      {!guest && (
        <Link href="/dashboard/qr" className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] text-zinc-400 hover:text-white">
          <LayoutGrid className="w-3 h-3" /> {tr('Barcha QR kodlarim', 'Все мои QR-коды', 'All my QR codes')}
        </Link>
      )}
    </div>
  );
}
