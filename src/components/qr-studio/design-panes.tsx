'use client';

import React, { useState } from 'react';
import { Ban, Smile, Trash2, Upload } from 'lucide-react';
import { BUILTIN_LOGOS, PHONE_EMOJI_CATEGORIES, type GradientType } from '@/components/ui/qr-canvas';
import { useToast } from '@/components/ui/toast';
import type { QrDesign, UpdateDesign } from './qr-design';

/* Design controls of the QR studio. Each edits part of one QrDesign. */

interface PaneProps {
  design: QrDesign;
  update: UpdateDesign;
}

export function ColorsPane({ design, update }: PaneProps) {
  return (
    <>
        {/* Foreground Mode Radio */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase text-zinc-400">Foreground Color</label>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer">
              <input
                type="radio"
                name="color_mode"
                checked={design.colorMode === 'single'}
                onChange={() => update({ colorMode: 'single' })}
                className="text-indigo-600 focus:ring-0"
              />
              <span>Single Color</span>
            </label>
            <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer">
              <input
                type="radio"
                name="color_mode"
                checked={design.colorMode === 'gradient'}
                onChange={() => update({ colorMode: 'gradient' })}
                className="text-indigo-600 focus:ring-0"
              />
              <span>Color Gradient</span>
            </label>
            <label className="flex items-center gap-1.5 text-zinc-200 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={design.customEyeColor}
                onChange={(e) => update({ customEyeColor: e.target.checked })}
                className="text-indigo-600 focus:ring-0 rounded"
              />
              <span>Custom Eye Color</span>
            </label>
          </div>
        </div>

        {/* Color Pickers */}
        {design.colorMode === 'single' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300">Asosiy Rang (Body)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.fgColor}
                  onChange={(e) => update({ fgColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-zinc-200 uppercase">{design.fgColor}</span>
              </div>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300">Orqa Fon (Background)</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={design.bgColor}
                  onChange={(e) => update({ bgColor: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-zinc-200 uppercase">{design.bgColor}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300">Gradient 1</span>
              <input
                type="color"
                value={design.fgColor}
                onChange={(e) => update({ fgColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300">Gradient 2</span>
              <input
                type="color"
                value={design.gradientColor2}
                onChange={(e) => update({ gradientColor2: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300">Turi</span>
              <select
                value={design.gradientType}
                onChange={(e) => update({ gradientType: e.target.value as GradientType })}
                className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded px-2 py-1"
              >
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
              </select>
            </div>
          </div>
        )}

        {/* Custom Eye Colors if Enabled */}
        {design.customEyeColor && (
          <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300">Eye Frame Color</span>
              <input
                type="color"
                value={design.eyeFrameColor}
                onChange={(e) => update({ eyeFrameColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-300">Eye Ball Color</span>
              <input
                type="color"
                value={design.eyeBallColor}
                onChange={(e) => update({ eyeBallColor: e.target.value })}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
              />
            </div>
          </div>
        )}
    </>
  );
}

// Uploaded logos are stored with the design when saved to a link, so keep them small
const MAX_LOGO_BYTES = 100 * 1024;

export function LogoPane({ design, update }: PaneProps) {
  const { showToast } = useToast();
  const [logoTab, setLogoTab] = useState<'brands' | 'emojis' | 'upload'>('brands');
  const [customEmojiInput, setCustomEmojiInput] = useState('');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('popular');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      showToast('error', 'Logo hajmi 100 KB dan oshmasligi kerak');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      update({ customLogoUrl: uploadEvent.target?.result as string, centerLogo: 'custom', centerEmoji: null });
      showToast('success', 'Maxsus logotip yuklandi');
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
        {/* Logo Category Tabs & Background Option */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setLogoTab('brands')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                logoTab === 'brands'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Brend Logotiplar
            </button>
            <button
              type="button"
              onClick={() => setLogoTab('emojis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                logoTab === 'emojis'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span>Telefon Emodzilari</span>
            </button>
            <button
              type="button"
              onClick={() => setLogoTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                logoTab === 'upload'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rasm Yuklash</span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={design.removeBgBehindLogo}
              onChange={(e) => update({ removeBgBehindLogo: e.target.checked })}
              className="text-indigo-600 focus:ring-0 rounded"
            />
            <span>Belgi orqasidagi fonni tozalash</span>
          </label>
        </div>

        {/* TAB 1: BRAND LOGOS */}
        {logoTab === 'brands' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-zinc-400">
                Brend logotipi yoki “No Icon” ni tanlang:
              </span>
              {design.centerLogo === 'none' && !design.centerEmoji && !design.customLogoUrl && (
                <span className="text-[11px] text-rose-400 font-mono flex items-center gap-1">
                  <Ban className="w-3 h-3" /> Belgi yo‘q (Toza QR)
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2">
              {/* NO ICON BUTTON */}
              <button
                type="button"
                onClick={() => {
                  update({ centerLogo: 'none' });
                  update({ centerEmoji: null });
                  update({ customLogoUrl: null });
                  setCustomEmojiInput('');
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  design.centerLogo === 'none' && !design.centerEmoji && !design.customLogoUrl
                    ? 'bg-rose-500/15 border-rose-500/70 ring-2 ring-rose-500/40 text-rose-300'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Belgisiz toza QR kod"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-[10px] font-semibold truncate max-w-full">No Icon</span>
              </button>

              {/* BUILT-IN LOGOS */}
              {Object.entries(BUILTIN_LOGOS).map(([key, item]) => {
                const isSel = design.centerLogo === key && !design.customLogoUrl && !design.centerEmoji;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      update({ centerLogo: key });
                      update({ centerEmoji: null });
                      update({ customLogoUrl: null });
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSel
                        ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-400/50'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: item.svg }}
                    />
                    <span className="text-[10px] text-zinc-400 truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PHONE EMOJIS */}
        {logoTab === 'emojis' && (
          <div className="space-y-4">
            {/* Custom Emoji Input Box */}
            <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-400" />
                  <span>Telefondan yoki klaviaturadan istalgan emodzini kiriting:</span>
                </label>
                {design.centerEmoji && (
                  <button
                    type="button"
                    onClick={() => {
                      update({ centerEmoji: null });
                      setCustomEmojiInput('');
                    }}
                    className="text-[11px] text-zinc-400 hover:text-rose-400"
                  >
                    Tozalash
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={4}
                    value={customEmojiInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomEmojiInput(val);
                      if (val.trim()) {
                        update({ centerEmoji: val.trim() });
                        update({ centerLogo: 'none' });
                        update({ customLogoUrl: null });
                      } else {
                        update({ centerEmoji: null });
                      }
                    }}
                    placeholder="Masalan: 🚀, 😎, 👑, 🔥, 🏆..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-base focus:outline-none focus:border-indigo-500 placeholder:text-zinc-600 placeholder:text-xs"
                  />
                </div>

                {/* Direct Display Badge */}
                <div className="w-11 h-11 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl select-none">
                  {design.centerEmoji || '🔲'}
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                Smartfoningiz emodzi klaviaturasidan (iOS / Android) to‘g‘ridan-to‘g‘ri nusxalab qo‘yishingiz mumkin.
              </p>
            </div>

            {/* Emoji Category Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {PHONE_EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveEmojiCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeEmojiCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-9 gap-2">
              {/* NO ICON BUTTON IN EMOJI TAB */}
              <button
                type="button"
                onClick={() => {
                  update({ centerLogo: 'none' });
                  update({ centerEmoji: null });
                  update({ customLogoUrl: null });
                  setCustomEmojiInput('');
                }}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  design.centerLogo === 'none' && !design.centerEmoji && !design.customLogoUrl
                    ? 'bg-rose-500/15 border-rose-500/70 ring-2 ring-rose-500/40 text-rose-300'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Belgisiz toza QR kod"
              >
                <Ban className="w-5 h-5 text-rose-400" />
                <span className="text-[9px] font-semibold">No Icon</span>
              </button>

              {/* EMOJIS FROM ACTIVE CATEGORY */}
              {(
                PHONE_EMOJI_CATEGORIES.find((c) => c.id === activeEmojiCategory)?.emojis ||
                PHONE_EMOJI_CATEGORIES[0].emojis
              ).map((emoji) => {
                const isSel = design.centerEmoji === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      update({ centerEmoji: emoji });
                      setCustomEmojiInput(emoji);
                      update({ centerLogo: 'none' });
                      update({ customLogoUrl: null });
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-center text-2xl transition-transform hover:scale-110 active:scale-95 ${
                      isSel
                        ? 'bg-indigo-600/25 border-indigo-500 ring-2 ring-indigo-400/50 scale-105'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span>{emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: UPLOAD IMAGE */}
        {logoTab === 'upload' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Fayl tanlash (.png, .svg, .jpg, .webp)</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>

              {design.customLogoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    update({ customLogoUrl: null });
                    update({ centerLogo: 'none' });
                    update({ centerEmoji: null });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 border border-zinc-800 rounded-xl text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yuklangan rasmni o‘chirish</span>
                </button>
              )}
            </div>

            {design.customLogoUrl && (
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 inline-flex items-center gap-3">
                <img
                  src={design.customLogoUrl}
                  alt="Custom logo"
                  className="w-12 h-12 object-contain rounded-lg border border-zinc-700 bg-white/5 p-1"
                />
                <div className="text-xs">
                  <p className="font-medium text-white">Yuklangan maxsus rasm faol</p>
                  <p className="text-[11px] text-zinc-400">QR kod markazida aks etadi</p>
                </div>
              </div>
            )}
          </div>
        )}
    </>
  );
}

export function ShapesPane({ design, update }: PaneProps) {
  return (
    <>
        {/* 4.1 Body Shape */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">Body Shape</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'square' as const, label: 'Square' },
              { id: 'dots' as const, label: 'Dots (Circles)' },
              { id: 'rounded' as const, label: 'Rounded' },
              { id: 'diamond' as const, label: 'Diamond' },
              { id: 'mosaic' as const, label: 'Mosaic' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update({ bodyShape: item.id })}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                  design.bodyShape === item.id
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4.2 Eye Frame Shape */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">Eye Frame Shape</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'square' as const, label: 'Square' },
              { id: 'rounded' as const, label: 'Rounded' },
              { id: 'circle' as const, label: 'Circle' },
              { id: 'leaf' as const, label: 'Leaf (Asymmetric)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update({ eyeFrameShape: item.id })}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                  design.eyeFrameShape === item.id
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4.3 Eye Ball Shape */}
        <div>
          <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">Eye Ball Shape</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'square' as const, label: 'Square' },
              { id: 'circle' as const, label: 'Circle' },
              { id: 'rounded' as const, label: 'Rounded' },
              { id: 'diamond' as const, label: 'Diamond' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => update({ eyeBallShape: item.id })}
                className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                  design.eyeBallShape === item.id
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
    </>
  );
}
