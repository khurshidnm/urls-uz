'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart3, Check, Info, LayoutGrid, Loader2, Lock, Save, Zap } from 'lucide-react';
import { formatNumber, shortUrl } from '@/lib/utils';

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
  const { name, onNameChange, namePlaceholder, dynamic, onDynamicChange, dynamicAllowed, link, isSaved, dirty, saving, onSave, guest } = props;
  const option = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
      active ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
    }`;
  const label = guest
    ? 'Ro‘yxatdan o‘tib saqlash'
    : !isSaved
      ? 'QR kodni saqlash'
      : dirty
        ? 'O‘zgarishlarni saqlash'
        : 'Saqlangan';

  return (
    <div className="w-full mt-3 space-y-3">
      <div>
        <label htmlFor="qr-name" className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
          QR kod nomi
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
              <Lock className="w-3 h-3" /> Dinamik QR
            </span>
            <Link href={`/dashboard/links/${link.id}`} className="flex items-center gap-1 text-emerald-300/80 hover:text-emerald-200 font-mono">
              <BarChart3 className="w-3 h-3" /> {formatNumber(link.click_count)} skan
            </Link>
          </div>
          <p className="text-[11px] text-emerald-100/80 leading-relaxed">
            QR <span className="font-mono">{shortUrl(link.slug).replace(/^https?:\/\//, '')}</span> ga olib boradi. Ma’lumotni istalgan vaqt
            o‘zgartiring — chop etilgan QR o‘zgarmaydi, lekin yangi ma’lumotni ko‘rsatadi.
          </p>
        </div>
      ) : dynamicAllowed ? (
        <div className="space-y-2">
          <div className="flex gap-2" role="radiogroup" aria-label="QR turi">
            <button type="button" role="radio" aria-checked={dynamic} onClick={() => onDynamicChange(true)} className={option(dynamic)}>
              <Zap className="w-3 h-3" /> Dinamik
            </button>
            <button type="button" role="radio" aria-checked={!dynamic} onClick={() => onDynamicChange(false)} className={option(!dynamic)}>
              Statik
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            {dynamic
              ? 'QR qisqa havolani saqlaydi: ma’lumotni keyin o‘zgartirsangiz, chop etilgan QR ham yangi ma’lumotni ko‘rsatadi. Skanerlar hisoblanadi.'
              : 'Ma’lumot QR ichiga yoziladi va internet talab qilmaydi. Keyin tahrirlashingiz mumkin, lekin chop etilgan nusxa eskicha qoladi.'}
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
          <span>Wi-Fi QR faqat statik bo‘ladi: telefon tarmoqqa QR ichidagi ma’lumot bilan ulanadi. Saqlab, keyin tahrirlashingiz mumkin.</span>
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
          <LayoutGrid className="w-3 h-3" /> Barcha QR kodlarim
        </Link>
      )}
    </div>
  );
}
