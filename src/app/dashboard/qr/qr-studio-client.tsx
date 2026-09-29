'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { QrCanvas } from '@/components/ui/qr-canvas';
import {
  QrCode,
  Palette,
  Sliders,
  LayoutTemplate,
  Link2,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';

interface Props {
  links: any[];
}

export default function QrStudioClient({ links }: Props) {
  const { t, locale } = useLanguage();

  const [selectedLinkSlug, setSelectedLinkSlug] = useState(links[0]?.slug || '');
  const [customUrl, setCustomUrl] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Styling state
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [centerLogo, setCenterLogo] = useState<'none' | 'telegram' | 'instagram' | 'youtube' | 'globe'>('telegram');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [frameStyle, setFrameStyle] = useState<'bottom' | 'top' | 'none'>('bottom');

  const activeUrl = isCustomMode
    ? customUrl || 'https://urls.uz'
    : `${typeof window !== 'undefined' ? window.location.origin : 'https://urls.uz'}/${selectedLinkSlug || 'telegram'}`;

  const colorPresets = [
    { label: 'Obsidian Classic', fg: '#0f172a', bg: '#ffffff' },
    { label: 'Telegram Blue', fg: '#0088cc', bg: '#ffffff' },
    { label: 'Uzbekistan Emerald', fg: '#059669', bg: '#ffffff' },
    { label: 'Electric Indigo', fg: '#4f46e5', bg: '#ffffff' },
    { label: 'Ruby Crimson', fg: '#dc2626', bg: '#ffffff' },
    { label: 'Dark Mode Invert', fg: '#ffffff', bg: '#090d16' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">{t.qrStudio}</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Havolalaringiz uchun brendli dinamik QR kodlar yarating va yuqori sifatda yuklab oling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Settings Panel */}
        <div className="lg:col-span-7 space-y-5">
          {/* Target Link Selector */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
            <label className="block text-xs font-bold text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" />
              <span>QR Kod bog‘langan manzil</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  !isCustomMode
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Mening havolalarimdan
              </button>
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  isCustomMode
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Ixtiyoriy URL / Matn
              </button>
            </div>

            {!isCustomMode ? (
              <select
                value={selectedLinkSlug}
                onChange={(e) => setSelectedLinkSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                {links.map((l) => (
                  <option key={l.id} value={l.slug}>
                    {l.title} (urls.uz/{l.slug})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://t.me/kanal yoki https://mywebsite.uz"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* Color Presets & Custom Picker */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <label className="block text-xs font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>Ranglar dizayni</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {colorPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setFgColor(preset.fg);
                    setBgColor(preset.bg);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    fgColor === preset.fg && bgColor === preset.bg
                      ? 'bg-indigo-600/30 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: preset.fg }} />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Old rang (Foreground)</label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-white uppercase">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Orqa fon (Background)</label>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-white uppercase">{bgColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Options */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
            <label className="block text-xs font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Markaziy brend belgisi</span>
            </label>

            <div className="grid grid-cols-5 gap-2">
              {(['telegram', 'instagram', 'youtube', 'globe', 'none'] as const).map((logo) => (
                <button
                  key={logo}
                  onClick={() => setCenterLogo(logo)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center capitalize transition-all ${
                    centerLogo === logo
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {logo === 'none' ? 'Yo‘q' : logo}
                </button>
              ))}
            </div>
          </div>

          {/* Frame & Call to Action */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
            <label className="block text-xs font-bold text-white flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-amber-400" />
              <span>Ramka va Matn</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFrameStyle('bottom')}
                className={`py-2 text-xs font-semibold rounded-xl border ${
                  frameStyle === 'bottom' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Pastki ramka
              </button>
              <button
                type="button"
                onClick={() => setFrameStyle('top')}
                className={`py-2 text-xs font-semibold rounded-xl border ${
                  frameStyle === 'top' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Yuqori ramka
              </button>
              <button
                type="button"
                onClick={() => setFrameStyle('none')}
                className={`py-2 text-xs font-semibold rounded-xl border ${
                  frameStyle === 'none' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Ramkasiz
              </button>
            </div>

            {frameStyle !== 'none' && (
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  value={frameText}
                  onChange={(e) => setFrameText(e.target.value)}
                  placeholder="SCAN ME"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['SCAN ME', 'TELEGRAM KANAL', 'BUYURTMA BERISH', 'CHEGIRMA'].map((txt) => (
                    <button
                      key={txt}
                      onClick={() => setFrameText(txt)}
                      className="px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview & Download Box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center sticky top-24">
          <div className="w-full glass-panel p-8 rounded-3xl border border-white/10 text-center shadow-2xl flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-6 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real Vaqt Ko‘rinishi</span>
            </div>

            <QrCanvas
              url={activeUrl}
              size={280}
              fgColor={fgColor}
              bgColor={bgColor}
              centerLogo={centerLogo}
              frameText={frameText}
              frameStyle={frameStyle}
              showControls={true}
            />

            <div className="mt-6 text-xs text-slate-400 max-w-xs">
              <p className="font-semibold text-white mb-0.5">Dinamik yo‘naltirish</p>
              <p className="text-[11px]">Chop etgandan keyin ham havolani boshqaruv panelidan o‘zgartirishingiz mumkin.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
