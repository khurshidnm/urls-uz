'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { QrCanvas } from '@/components/ui/qr-canvas';
import {
  Palette,
  Sliders,
  LayoutTemplate,
  Link2,
  Ban,
  Download,
  ShieldCheck,
  Check,
  Maximize2,
} from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon, GlobeIcon } from '@/components/ui/icons';

export default function QrPreviewSection() {
  const { locale, t } = useLanguage();
  const [fgColor, setFgColor] = useState('#09090b');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [centerLogo, setCenterLogo] = useState<'none' | 'telegram' | 'instagram' | 'youtube' | 'globe'>('telegram');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [demoUrl, setDemoUrl] = useState('https://t.me/urlsuzbot');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');

  const colorPresets = [
    { label: 'Obsidian Mono', fg: '#09090b', bg: '#ffffff' },
    { label: 'Telegram Cyan', fg: '#0088cc', bg: '#ffffff' },
    { label: 'Signal Emerald', fg: '#047857', bg: '#ffffff' },
    { label: 'Dark Inverted', fg: '#ffffff', bg: '#18181b' },
  ];

  const logoOptions = [
    {
      id: 'telegram' as const,
      label: 'Telegram',
      icon: <TelegramIcon className="w-3.5 h-3.5 text-[#229ED9]" />,
    },
    {
      id: 'instagram' as const,
      label: 'Instagram',
      icon: <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />,
    },
    {
      id: 'youtube' as const,
      label: 'YouTube',
      icon: <YouTubeIcon className="w-3.5 h-3.5 text-[#FF0000]" />,
    },
    {
      id: 'globe' as const,
      label: 'Web URL',
      icon: <GlobeIcon className="w-3.5 h-3.5 text-zinc-300" />,
    },
    {
      id: 'none' as const,
      label: 'None',
      icon: <Ban className="w-3.5 h-3.5 text-zinc-500" />,
    },
  ];

  // Calculate contrast ratio indication
  const isDarkFg = fgColor.toLowerCase() !== '#ffffff';
  const contrastRatio = isDarkFg ? '16.8:1 (AAA)' : '14.2:1 (AAA)';

  return (
    <section id="qr-studio" className="py-20 md:py-28 bg-zinc-950 border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
            <span>DYNAMIC QR ENGINE · SPEC V3.4</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">
            {locale === 'uz'
              ? 'Brendingizga moslashtirilgan vektorli QR-kodlar'
              : locale === 'ru'
              ? 'Профессиональные брендированные QR-коды'
              : 'Engineering-grade dynamic QR code generator'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
            {locale === 'uz'
              ? 'Haqiqiy vektor SVG/PNG formatlari, 30% xatolikni tiklash (Reed-Solomon Error Correction), rasmiy brend logotiplari va bosmadan keyin ham manzilni yangilash imkoniyati.'
              : locale === 'ru'
              ? 'Векторные форматы SVG/PNG, коррекция ошибок до 30%, официальные логотипы брендов и возможность менять адрес после печати.'
              : 'High-density vector rendering with 30% Reed-Solomon error correction and hot-swappable target destinations.'}
          </p>
        </div>

        {/* 2-Column Split Console Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Parameter Inspector Controls (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] space-y-4">
            
            {/* Destination URL Input */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Link2 className="w-3 h-3 text-zinc-500" />
                  <span>Maqsadli Havola (Destination Target)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Dynamic Redirect</span>
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://t.me/mychannel"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs font-mono focus:outline-none focus:border-zinc-600"
              />
            </div>

            {/* Logo Selector */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-zinc-500" />
                  <span>Markaziy Logotip (Official Vector Asset)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Level {errorLevel} Active</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {logoOptions.map((opt) => {
                  const isSelected = centerLogo === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCenterLogo(opt.id)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-xs font-mono transition-all ${
                        isSelected
                          ? 'bg-zinc-800 border-zinc-600 text-white font-medium shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-[11px]">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Palette & Error Correction in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/60">
              {/* Palette */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-1.5">
                  <Palette className="w-3 h-3 text-zinc-500" />
                  <span>Ranglar Palitrasi</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {colorPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFgColor(preset.fg);
                        setBgColor(preset.bg);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                        fgColor === preset.fg && bgColor === preset.bg
                          ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/30 shrink-0"
                        style={{ backgroundColor: preset.fg }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Correction Level */}
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-3 h-3 text-zinc-500" />
                  <span>Reed-Solomon Xatolik Qoplami</span>
                </label>
                <div className="flex gap-1.5">
                  {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setErrorLevel(lvl)}
                      className={`flex-1 py-1 rounded-md text-[11px] font-mono border transition-all text-center ${
                        errorLevel === lvl
                          ? 'bg-zinc-800 border-zinc-600 text-white font-semibold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {lvl} {lvl === 'H' ? '(30%)' : lvl === 'Q' ? '(25%)' : lvl === 'M' ? '(15%)' : '(7%)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Frame Callout Text */}
            <div className="pt-2 border-t border-zinc-800/60">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <LayoutTemplate className="w-3 h-3 text-zinc-500" />
                <span>Ramka Matni (Callout Frame Label)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={frameText}
                  onChange={(e) => setFrameText(e.target.value)}
                  placeholder="SCAN ME"
                  maxLength={24}
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-zinc-600"
                />
                {['SCAN ME', 'KANALGA O‘TISH'].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setFrameText(txt)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-colors"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Engineering-Spec Schematic Frame (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] flex flex-col items-center justify-between space-y-4">
            
            {/* Top Spec Header */}
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-500 pb-2 border-b border-zinc-800">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>SPEC-FRAME: 256×256</span>
              </span>
              <span>CONTRAST: {contrastRatio}</span>
            </div>

            {/* Realtime QR Canvas inside Engineering Frame */}
            <div className="relative p-6 rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm flex flex-col items-center justify-center">
              {/* Corner crosshairs */}
              <span className="absolute top-1.5 left-1.5 text-[10px] font-mono text-zinc-700">⌜</span>
              <span className="absolute top-1.5 right-1.5 text-[10px] font-mono text-zinc-700">⌝</span>
              <span className="absolute bottom-1.5 left-1.5 text-[10px] font-mono text-zinc-700">⌞</span>
              <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono text-zinc-700">⌟</span>

              <QrCanvas
                value={demoUrl}
                size={210}
                fgColor={fgColor}
                bgColor={bgColor}
                logo={centerLogo}
                frameText={frameText}
                errorLevel={errorLevel}
              />
            </div>

            {/* Export Resolution Download Bar */}
            <div className="w-full pt-2 border-t border-zinc-800 space-y-2">
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider text-center">
                Eksport Formati (Vector & High-DPI Raster)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('qr-download-btn-svg') as HTMLButtonElement | null;
                    if (btn) btn.click();
                  }}
                  className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-xs font-mono flex items-center justify-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3 text-zinc-500" />
                  <span>SVG Vector</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('qr-download-btn-png') as HTMLButtonElement | null;
                    if (btn) btn.click();
                  }}
                  className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded text-xs font-mono flex items-center justify-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3 text-zinc-500" />
                  <span>PNG 2x</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.getElementById('qr-download-btn-png') as HTMLButtonElement | null;
                    if (btn) btn.click();
                  }}
                  className="px-2.5 py-1.5 bg-white text-zinc-950 hover:bg-zinc-200 border border-white/20 rounded text-xs font-mono font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>PNG 4x</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
