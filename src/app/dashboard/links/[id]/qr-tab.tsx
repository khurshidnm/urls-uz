'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, RotateCcw, Save, Wand2 } from 'lucide-react';
import { BUILTIN_LOGOS, QrCanvas } from '@/components/ui/qr-canvas';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/lib/language-context';
import { shortUrl } from '@/lib/utils';
import type { ClientLink } from '@/lib/client-types';

type QrConfig = NonNullable<ClientLink['qr_config']>;

const DEFAULT_CONFIG: QrConfig = {
  fgColor: '#0f172a',
  bgColor: '#ffffff',
  colorMode: 'single',
  gradientColor2: '#4f46e5',
  bodyShape: 'rounded',
  eyeFrameShape: 'rounded',
  eyeBallShape: 'rounded',
  centerLogo: 'none',
  frameText: 'SCAN ME',
  frameStyle: 'bottom',
};

const BODY_SHAPES = [
  ['square', ['Kvadrat', 'Квадрат', 'Square']],
  ['rounded', ['Yumaloq', 'Скруглённые', 'Rounded']],
  ['dots', ['Nuqtalar', 'Точки', 'Dots']],
  ['diamond', ['Olmos', 'Ромб', 'Diamond']],
  ['mosaic', ['Mozaika', 'Мозаика', 'Mosaic']],
] as const;
const EYE_FRAMES = [
  ['square', ['Kvadrat', 'Квадрат', 'Square']],
  ['rounded', ['Yumaloq', 'Скруглённые', 'Rounded']],
  ['circle', ['Doira', 'Круг', 'Circle']],
  ['leaf', ['Barg', 'Лист', 'Leaf']],
] as const;
const EYE_BALLS = [
  ['square', ['Kvadrat', 'Квадрат', 'Square']],
  ['rounded', ['Yumaloq', 'Скруглённые', 'Rounded']],
  ['circle', ['Doira', 'Круг', 'Circle']],
  ['diamond', ['Olmos', 'Ромб', 'Diamond']],
] as const;

const selectClass =
  'w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-zinc-600';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-mono text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

/**
 * QR design for this link. The code always encodes the short URL, so the
 * printed QR keeps working when the destination changes.
 */
export default function QrTab({ link, canWrite, onSaved }: { link: ClientLink; canWrite: boolean; onSaved: (link: ClientLink) => void }) {
  const { showToast } = useToast();
  const { tr } = useLanguage();
  const saved: QrConfig = { ...DEFAULT_CONFIG, ...(link.qr_config ?? {}) };
  const [config, setConfig] = useState<QrConfig>(saved);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(config) !== JSON.stringify(saved);

  const set = <K extends keyof QrConfig>(key: K, value: QrConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_config: config }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(data.link);
        showToast('success', tr('QR dizayn saqlandi', 'Дизайн QR сохранён', 'QR design saved'));
      } else {
        showToast('error', data.error || tr('Saqlashda xatolik', 'Ошибка сохранения', 'Couldn’t save'));
      }
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
      <div className="glass-card-static p-5 rounded-2xl border border-[var(--border-subtle)] space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">{tr('QR kod dizayni', 'Дизайн QR-кода', 'QR code design')}</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {tr('QR har doim qisqa havolaga olib boradi — manzilni keyin o‘zgartirsangiz ham chop etilgan QR ishlayveradi.', 'QR всегда ведёт на короткую ссылку — напечатанный QR работает, даже если позже сменить адрес.', 'The QR always points to the short link, so a printed QR keeps working if you change the destination later.')}
            </p>
          </div>
          <Link
            href={`/dashboard/qr/new?link=${link.id}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" /> QR Studio
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label={tr('Asosiy rang', 'Основной цвет', 'Main colour')}>
            <input type="color" value={config.fgColor} onChange={(e) => set('fgColor', e.target.value)} className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer" />
          </Field>
          <Field label={tr('Fon rangi', 'Цвет фона', 'Background')}>
            <input type="color" value={config.bgColor} onChange={(e) => set('bgColor', e.target.value)} className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer" />
          </Field>
          <Field label={tr('Gradient', 'Градиент', 'Gradient')}>
            <select value={config.colorMode} onChange={(e) => set('colorMode', e.target.value as QrConfig['colorMode'])} className={selectClass}>
              <option value="single">{tr('Yo‘q', 'Нет', 'No')}</option>
              <option value="gradient">{tr('Bor', 'Да', 'Yes')}</option>
            </select>
          </Field>
          <Field label={tr('Gradient rangi', 'Цвет градиента', 'Gradient colour')}>
            <input
              type="color"
              value={config.gradientColor2}
              disabled={config.colorMode !== 'gradient'}
              onChange={(e) => set('gradientColor2', e.target.value)}
              className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer disabled:opacity-30"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label={tr('Nuqtalar shakli', 'Форма точек', 'Dot shape')}>
            <select value={config.bodyShape} onChange={(e) => set('bodyShape', e.target.value as QrConfig['bodyShape'])} className={selectClass}>
              {BODY_SHAPES.map(([v, l]) => <option key={v} value={v}>{tr(l[0], l[1], l[2])}</option>)}
            </select>
          </Field>
          <Field label={tr('Ko‘z ramkasi', 'Рамка «глаза»', 'Eye frame')}>
            <select value={config.eyeFrameShape} onChange={(e) => set('eyeFrameShape', e.target.value as QrConfig['eyeFrameShape'])} className={selectClass}>
              {EYE_FRAMES.map(([v, l]) => <option key={v} value={v}>{tr(l[0], l[1], l[2])}</option>)}
            </select>
          </Field>
          <Field label={tr('Ko‘z markazi', 'Центр «глаза»', 'Eye centre')}>
            <select value={config.eyeBallShape} onChange={(e) => set('eyeBallShape', e.target.value as QrConfig['eyeBallShape'])} className={selectClass}>
              {EYE_BALLS.map(([v, l]) => <option key={v} value={v}>{tr(l[0], l[1], l[2])}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label={tr('Markaziy logotip', 'Логотип в центре', 'Centre logo')}>
            <select value={config.centerLogo} onChange={(e) => set('centerLogo', e.target.value)} className={selectClass}>
              <option value="none">{tr('Logotipsiz', 'Без логотипа', 'No logo')}</option>
              {Object.entries(BUILTIN_LOGOS).map(([key, logo]) => (
                <option key={key} value={key}>{logo.labels ? tr(logo.labels[0], logo.labels[1], logo.labels[2]) : logo.label}</option>
              ))}
            </select>
          </Field>
          <Field label={tr('Ramka matni', 'Текст рамки', 'Frame text')}>
            <input
              type="text"
              value={config.frameText}
              maxLength={40}
              onChange={(e) => set('frameText', e.target.value)}
              className={selectClass}
            />
          </Field>
          <Field label={tr('Ramka joyi', 'Положение рамки', 'Frame position')}>
            <select value={config.frameStyle} onChange={(e) => set('frameStyle', e.target.value as QrConfig['frameStyle'])} className={selectClass}>
              <option value="bottom">{tr('Pastda', 'Снизу', 'Bottom')}</option>
              <option value="top">{tr('Tepada', 'Сверху', 'Top')}</option>
              <option value="none">{tr('Ramkasiz', 'Без рамки', 'No frame')}</option>
            </select>
          </Field>
        </div>

        {canWrite && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => setConfig(saved)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {tr('Bekor qilish', 'Отмена', 'Cancel')}
            </button>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={save}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {tr('Saqlash', 'Сохранить', 'Save')}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center lg:block">
        <QrCanvas url={shortUrl(link.slug)} size={260} {...config} showControls />
      </div>
    </div>
  );
}
