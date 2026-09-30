'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, RotateCcw, Save, Wand2 } from 'lucide-react';
import { BUILTIN_LOGOS, QrCanvas } from '@/components/ui/qr-canvas';
import { useToast } from '@/components/ui/toast';
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
  ['square', 'Kvadrat'],
  ['rounded', 'Yumaloq'],
  ['dots', 'Nuqtalar'],
  ['diamond', 'Olmos'],
  ['mosaic', 'Mozaika'],
] as const;
const EYE_FRAMES = [
  ['square', 'Kvadrat'],
  ['rounded', 'Yumaloq'],
  ['circle', 'Doira'],
  ['leaf', 'Barg'],
] as const;
const EYE_BALLS = [
  ['square', 'Kvadrat'],
  ['rounded', 'Yumaloq'],
  ['circle', 'Doira'],
  ['diamond', 'Olmos'],
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
        showToast('success', 'QR dizayn saqlandi');
      } else {
        showToast('error', data.error || 'Saqlashda xatolik');
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
            <h3 className="text-sm font-bold text-white">QR kod dizayni</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              QR har doim qisqa havolaga olib boradi — manzilni keyin o‘zgartirsangiz ham chop etilgan QR ishlayveradi.
            </p>
          </div>
          <Link
            href={`/dashboard/qr?link=${link.id}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" /> QR Studio
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Asosiy rang">
            <input type="color" value={config.fgColor} onChange={(e) => set('fgColor', e.target.value)} className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer" />
          </Field>
          <Field label="Fon rangi">
            <input type="color" value={config.bgColor} onChange={(e) => set('bgColor', e.target.value)} className="w-full h-9 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer" />
          </Field>
          <Field label="Gradient">
            <select value={config.colorMode} onChange={(e) => set('colorMode', e.target.value as QrConfig['colorMode'])} className={selectClass}>
              <option value="single">Yo‘q</option>
              <option value="gradient">Bor</option>
            </select>
          </Field>
          <Field label="Gradient rangi">
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
          <Field label="Nuqtalar shakli">
            <select value={config.bodyShape} onChange={(e) => set('bodyShape', e.target.value as QrConfig['bodyShape'])} className={selectClass}>
              {BODY_SHAPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Ko‘z ramkasi">
            <select value={config.eyeFrameShape} onChange={(e) => set('eyeFrameShape', e.target.value as QrConfig['eyeFrameShape'])} className={selectClass}>
              {EYE_FRAMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Ko‘z markazi">
            <select value={config.eyeBallShape} onChange={(e) => set('eyeBallShape', e.target.value as QrConfig['eyeBallShape'])} className={selectClass}>
              {EYE_BALLS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Markaziy logotip">
            <select value={config.centerLogo} onChange={(e) => set('centerLogo', e.target.value)} className={selectClass}>
              <option value="none">Logotipsiz</option>
              {Object.entries(BUILTIN_LOGOS).map(([key, logo]) => (
                <option key={key} value={key}>{logo.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Ramka matni">
            <input
              type="text"
              value={config.frameText}
              maxLength={40}
              onChange={(e) => set('frameText', e.target.value)}
              className={selectClass}
            />
          </Field>
          <Field label="Ramka joyi">
            <select value={config.frameStyle} onChange={(e) => set('frameStyle', e.target.value as QrConfig['frameStyle'])} className={selectClass}>
              <option value="bottom">Pastda</option>
              <option value="top">Tepada</option>
              <option value="none">Ramkasiz</option>
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
              <RotateCcw className="w-3.5 h-3.5" /> Bekor qilish
            </button>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={save}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Saqlash
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
