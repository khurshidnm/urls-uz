'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Info, Loader2, Save } from 'lucide-react';
import { QrCanvas } from '@/components/ui/qr-canvas';
import type { ClientLink } from '@/lib/client-types';
import type { QrDesign, UpdateDesign } from './qr-design';
import SavePanel, { type SavePanelProps } from './save-panel';
import { useLanguage } from '@/lib/language-context';

const FRAME_PRESETS = ['SCAN ME', 'VISIT LINK', 'SAVE CONTACT', 'CONNECT WI-FI', 'OPEN MAP'];

/** Text around the QR ("SCAN ME"), shown once under the preview. */
function FrameTextControl({ design, update }: { design: QrDesign; update: UpdateDesign }) {
  const { tr } = useLanguage();
  const hasText = design.frameStyle !== 'none' && Boolean(design.frameText.trim());
  const option = (active: boolean) =>
    `px-2 py-0.5 rounded transition-all ${active ? 'bg-indigo-600 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'}`;

  return (
    <div className="w-full mt-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase text-zinc-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" /> {tr('Ramka matni', 'Текст рамки', 'Frame text')}
        </span>
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
          <button
            type="button"
            onClick={() => update({ frameStyle: 'none', frameText: '' })}
            className={`px-2 py-0.5 rounded transition-all ${!hasText ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {tr('Matnsiz', 'Без текста', 'No text')}
          </button>
          <button type="button" onClick={() => update({ frameStyle: 'bottom', frameText: design.frameText.trim() || 'SCAN ME' })} className={option(hasText && design.frameStyle === 'bottom')}>
            {tr('Pastda', 'Снизу', 'Bottom')}
          </button>
          <button type="button" onClick={() => update({ frameStyle: 'top', frameText: design.frameText.trim() || 'SCAN ME' })} className={option(hasText && design.frameStyle === 'top')}>
            {tr('Tepada', 'Сверху', 'Top')}
          </button>
        </div>
      </div>
      {design.frameStyle !== 'none' && (
        <input
          type="text"
          value={design.frameText}
          maxLength={40}
          onChange={(e) => update({ frameText: e.target.value })}
          placeholder={tr('Matn (masalan: SCAN ME)', 'Текст (например: SCAN ME)', 'Text (e.g. SCAN ME)')}
          className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-xs font-mono uppercase focus:outline-none focus:border-indigo-500"
        />
      )}
      <div className="flex flex-wrap gap-1.5">
        {FRAME_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => update({ frameText: preset, frameStyle: design.frameStyle === 'none' ? 'bottom' : design.frameStyle })}
            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
              hasText && design.frameText === preset ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

export type PreviewMode =
  | { kind: 'link'; link: ClientLink; dirty: boolean; saving: boolean; onSave: () => void }
  | { kind: 'qr'; save: SavePanelProps };

interface Props {
  payload: string;
  design: QrDesign;
  update: UpdateDesign;
  resolution: number;
  setResolution: (value: number) => void;
  mode: PreviewMode;
}

export default function QrPreviewPanel({ payload, design, update, resolution, setResolution, mode }: Props) {
  const { tr } = useLanguage();
  return (
    <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 shadow-2xl flex flex-col items-center">
      <div className="w-full mb-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>{tr('Yuklab olish sifati', 'Качество скачивания', 'Download quality')}</span>
          <span className="text-white font-semibold">
            {resolution} × {resolution} px
          </span>
        </div>
        <input
          type="range"
          min="300"
          max="2000"
          step="100"
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value))}
          aria-label={tr('Yuklab olish sifati', 'Качество скачивания', 'Download quality')}
          className="w-full accent-indigo-500 bg-zinc-950 h-1.5 rounded-lg cursor-pointer"
        />
      </div>

      {mode.kind === 'qr' && mode.save.pendingDynamic && (
        <div className="w-full mb-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-[11px] text-indigo-200/90 flex gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span>{tr('Saqlaganingizda QR qisqa havolaga o‘tadi. Chop etish uchun saqlangandan keyin yuklab oling.', 'После сохранения QR перейдёт на короткую ссылку. Для печати скачайте его после сохранения.', 'Once saved, the QR switches to a short link. Download it after saving if you’re going to print it.')}</span>
        </div>
      )}

      <QrCanvas
        value={payload}
        size={240}
        exportResolution={resolution}
        {...design}
        errorLevel={payload.length > 200 ? 'M' : design.errorLevel}
        showControls={!(mode.kind === 'qr' && mode.save.pendingDynamic)}
      />

      <FrameTextControl design={design} update={update} />

      {mode.kind === 'link' && (
        <div className="w-full mt-3 space-y-2">
          <button
            type="button"
            onClick={mode.onSave}
            disabled={!mode.dirty || mode.saving}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {mode.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode.dirty ? tr('Dizaynni havolaga saqlash', 'Сохранить дизайн для ссылки', 'Save design to link') : tr('Dizayn saqlangan', 'Дизайн сохранён', 'Design saved')}
          </button>
          <Link
            href={`/dashboard/links/${mode.link.id}?tab=qr`}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-zinc-400 hover:text-white"
          >
            <ExternalLink className="w-3 h-3" /> {tr('Havola sahifasi', 'Страница ссылки', 'Link page')}
          </Link>
          <p className="text-[11px] text-zinc-500 text-center">
            {tr('Dinamik QR: manzilni keyin o‘zgartirsangiz ham chop etilgan QR ishlayveradi va skanerlar hisoblanadi.', 'Динамический QR: напечатанный QR работает, даже если позже сменить адрес, а сканирования считаются.', 'Dynamic QR: the printed QR keeps working if you change the address later, and scans are counted.')}
          </p>
        </div>
      )}

      {mode.kind === 'qr' && <SavePanel {...mode.save} />}
    </div>
  );
}
