'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { QrCanvas } from '@/components/ui/qr-canvas';
import { Palette, Sparkles, Sliders, LayoutTemplate, ShieldCheck } from 'lucide-react';

export default function QrPreviewSection() {
  const { locale, t } = useLanguage();
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [centerLogo, setCenterLogo] = useState<'none' | 'telegram' | 'instagram' | 'youtube' | 'globe'>('telegram');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [demoUrl, setDemoUrl] = useState('https://urls.uz/demo');

  const colorPresets = [
    { label: 'Obsidian', fg: '#0f172a', bg: '#ffffff' },
    { label: 'Telegram Blue', fg: '#0088cc', bg: '#f0f9ff' },
    { label: 'Emerald', fg: '#065f46', bg: '#ecfdf5' },
    { label: 'Indigo', fg: '#4338ca', bg: '#eef2ff' },
    { label: 'Crimson', fg: '#991b1b', bg: '#fef2f2' },
  ];

  return (
    <section id="qr-studio" className="py-20 bg-slate-950/60 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Description & Controls */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.qrStudio}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              {locale === 'uz'
                ? 'Brendingizga moslashtirilgan professional QR-kodlar'
                : locale === 'ru'
                ? 'Профессиональные брендированные QR-коды'
                : 'Custom Branded QR Codes That Stand Out'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
              {locale === 'uz'
                ? 'Oddiy qora-oq kvadratlar davri o‘tdi. Markaziy logotip, maxsus ramka ("SCAN ME"), ranglar uyg‘unligi va vektor (SVG/PNG) formatida yuklab olish.'
                : locale === 'ru'
                ? 'Забудьте о скучных черно-белых квадратах. Добавляйте логотип, рамку с призывом к действию и настраивайте фирменные цвета.'
                : 'Upgrade beyond boring black-and-white codes. Add social logos, action frames, custom palettes, and export in crisp high-res.'}
            </p>

            {/* Interactive Control Toggles */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ranglar to‘plami (Presets)</span>
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
                        fgColor === preset.fg
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: preset.fg }} />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Markaziy logotip</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['telegram', 'instagram', 'youtube', 'none'] as const).map((logo) => (
                    <button
                      key={logo}
                      onClick={() => setCenterLogo(logo)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center capitalize transition-all ${
                        centerLogo === logo
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {logo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame text input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
                  <span>Ramka matni (Call to Action)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={frameText}
                    onChange={(e) => setFrameText(e.target.value)}
                    placeholder="SCAN ME"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  {['SCAN ME', 'BUY NOW', 'OPEN MENU'].map((txt) => (
                    <button
                      key={txt}
                      onClick={() => setFrameText(txt)}
                      className="px-2.5 py-1.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60"
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Canvas Box */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative p-6 rounded-3xl bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border border-white/10 shadow-2xl backdrop-blur-xl">
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-extrabold rounded-full shadow-lg">
                LIVE PREVIEW
              </div>
              <QrCanvas
                url={demoUrl}
                size={270}
                fgColor={fgColor}
                bgColor={bgColor}
                centerLogo={centerLogo}
                frameText={frameText}
                frameStyle="bottom"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
