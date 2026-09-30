'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import {
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Lock,
  Smartphone,
  Tablet,
  Flame,
  MessageCircle,
  Briefcase,
  BarChart3,
  Palette,
  ShieldCheck,
  TrendingUp,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon } from '@/components/ui/icons';

// Bulletproof fallback avatar vector in case external CDN fails
const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%236366f1'/><stop offset='50%' stop-color='%23a855f7'/><stop offset='100%' stop-color='%23ec4899'/></linearGradient></defs><circle cx='50' cy='50' r='50' fill='url(%23g)'/><circle cx='50' cy='38' r='18' fill='%23ffffff'/><path d='M18 86c0-17.7 14.3-32 32-32s32 14.3 32 32' fill='%23ffffff' opacity='0.95'/></svg>";

export default function BioPreviewSection() {
  const { locale, t } = useLanguage();
  const [device, setDevice] = useState<'phone' | 'tablet'>('phone');
  const [theme, setTheme] = useState<'midnight' | 'emerald' | 'indigo'>('midnight');
  const [copied, setCopied] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80'
  );

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('https://urls.uz/b/khurshid').catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const themeStyles = {
    midnight: {
      accentBorder: 'border-zinc-800',
      activeCardBorder: 'border-zinc-700',
      badgeBg: 'bg-zinc-900 text-zinc-300 border-zinc-800',
      badgeText: 'text-zinc-400',
      pinnedBg: 'bg-zinc-900/90',
      pinnedBorder: 'border-zinc-700',
      cardBg: 'bg-zinc-950/70',
      accentColor: 'text-indigo-400',
      dotColor: 'bg-zinc-400',
    },
    emerald: {
      accentBorder: 'border-emerald-500/25',
      activeCardBorder: 'border-emerald-500/40',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      badgeText: 'text-emerald-400',
      pinnedBg: 'bg-emerald-950/20',
      pinnedBorder: 'border-emerald-500/30',
      cardBg: 'bg-zinc-950/70',
      accentColor: 'text-emerald-400',
      dotColor: 'bg-emerald-400',
    },
    indigo: {
      accentBorder: 'border-indigo-500/25',
      activeCardBorder: 'border-indigo-500/40',
      badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      badgeText: 'text-indigo-400',
      pinnedBg: 'bg-indigo-950/20',
      pinnedBorder: 'border-indigo-500/30',
      cardBg: 'bg-zinc-950/70',
      accentColor: 'text-indigo-400',
      dotColor: 'bg-indigo-400',
    },
  };

  const currentTheme = themeStyles[theme];

  return (
    <section
      id="bio-builder"
      className="py-20 md:py-28 relative overflow-hidden bg-zinc-950 border-b border-zinc-800/80 select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Device Showcase (Linear Flat Standard) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center order-2 lg:order-1">
            
            {/* Device Switcher Selector Bar (Phone vs Tablet/Desktop) */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg mb-6 shadow-sm text-xs font-mono">
              <button
                type="button"
                onClick={() => setDevice('phone')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  device === 'phone'
                    ? 'bg-zinc-800 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </button>
              <button
                type="button"
                onClick={() => setDevice('tablet')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all ${
                  device === 'tablet'
                    ? 'bg-zinc-800 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet/Desktop</span>
              </button>
            </div>

            {/* Flat Viewport Stage */}
            <div className="w-full flex flex-col items-center justify-center">
              
              {device === 'phone' ? (
                /* ================= FLAT OBSIDIAN MOBILE VIEWPORT ================= */
                <div className="w-[320px] sm:w-[340px] rounded-[32px] p-3 bg-[#0d0d10] border border-zinc-800 shadow-2xl shadow-black/80 flex flex-col justify-between transition-all duration-200">
                  
                  {/* Subtle Minimalist Notch / Speaker bar */}
                  <div className="w-20 h-3.5 bg-zinc-900 border border-zinc-800/80 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-zinc-800" />
                  </div>

                  {/* Inner Display Screen */}
                  <div className={`rounded-[22px] bg-[#09090b] border ${currentTheme.accentBorder} p-4 flex flex-col justify-between transition-colors duration-300 space-y-4`}>
                    
                    {/* Status Bar */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none pb-1 border-b border-zinc-800/50">
                      <span>9:41</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">5G</span>
                        <div className="w-4 h-2 rounded-[2px] border border-zinc-400 p-[1px] flex items-center">
                          <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
                        </div>
                      </div>
                    </div>

                    {/* Profile Header */}
                    <div className="text-center space-y-2 pt-1">
                      {/* Avatar */}
                      <div className="relative mx-auto w-16 h-16 rounded-full p-0.5 bg-zinc-800 border border-zinc-700 shadow-sm">
                        <img
                          src={avatarSrc}
                          alt="Creator Avatar"
                          onError={() => setAvatarSrc(FALLBACK_AVATAR)}
                          className="w-full h-full rounded-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#09090b] flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </span>
                      </div>

                      {/* Name & Route */}
                      <div>
                        <div className="flex items-center justify-center gap-1.5">
                          <h4 className="font-semibold text-white text-sm tracking-tight">Khurshid Nurmukhamedov</h4>
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          @khurshid · urls.uz/b/khurshid
                        </p>
                      </div>

                      {/* Bio Description */}
                      <p className="text-[11px] text-zinc-400 leading-relaxed max-w-[240px] mx-auto">
                        Tadbirkor & Veb Dasturchi. Toshkent shahrida startaplar va raqamli marketing loyihalari 🚀
                      </p>

                      {/* Social Channels */}
                      <div className="flex justify-center gap-2 pt-1">
                        <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-[#229ED9] hover:bg-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-center cursor-pointer">
                          <TelegramIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-[#E1306C] hover:bg-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-center cursor-pointer">
                          <InstagramIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-[#FF0000] hover:bg-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-center cursor-pointer">
                          <YouTubeIcon className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    {/* Bio Link Cards (Matching urls.uz Design Standard) */}
                    <div className="space-y-2 pt-1 text-left">
                      {/* Pinned / Featured Link */}
                      <div className={`p-2.5 rounded-lg ${currentTheme.pinnedBg} border ${currentTheme.pinnedBorder} hover:border-zinc-600 transition-all flex items-center justify-between group cursor-pointer shadow-sm`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                            <Flame className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              🔥 Yangi Kurs & Loyihalarim
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 truncate">
                              Startup Academy 2026
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            1.4k
                          </span>
                          <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                        </div>
                      </div>

                      {/* Link 2: Telegram Channel */}
                      <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] flex items-center justify-center shrink-0">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              Telegram Kanalga Qo‘shilish
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 truncate">
                              @khurshid_notes — Eksklyuziv
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                          <span className="text-[10px] font-mono text-zinc-500">
                            920
                          </span>
                          <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                        </div>
                      </div>

                      {/* Link 3: Portfolio & Partnership */}
                      <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center shrink-0">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">
                              Portfolio & Aloqa
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 truncate">
                              Startaplar va hamkorlik
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
                      </div>
                    </div>

                    {/* Telemetry Footer */}
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>LIVE TELEMETRY</span>
                      </span>
                      <span>3,420 bosish</span>
                    </div>
                  </div>

                  {/* Flat Home Indicator Bar */}
                  <div className="w-24 h-1 bg-zinc-700/60 rounded-full mx-auto mt-2" />
                </div>
              ) : (
                /* ================= FLAT TABLET / DESKTOP VIEWPORT ================= */
                <div className="w-full max-w-[560px] rounded-2xl p-3 bg-[#0d0d10] border border-zinc-800 shadow-2xl shadow-black/80 flex flex-col justify-between transition-all duration-200">
                  
                  {/* Browser Window Header Chrome */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800/80 text-xs font-mono">
                    {/* Traffic Lights */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/80" />
                    </div>

                    {/* URL Pill Bar */}
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 rounded-md border border-zinc-800 text-[11px] font-mono text-zinc-300">
                      <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span>urls.uz/b/khurshid</span>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Havolani nusxalash"
                      >
                        {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>ACTIVE</span>
                    </div>
                  </div>

                  {/* Inner Screen Display (2-Column Responsive Layout) */}
                  <div className={`rounded-xl bg-[#09090b] border ${currentTheme.accentBorder} p-4 sm:p-5 transition-colors duration-300`}>
                    <div className="grid grid-cols-12 gap-4 items-center">
                      
                      {/* Left Column: Creator Profile (5 cols) */}
                      <div className="col-span-12 sm:col-span-5 text-center p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                        <div className="relative mx-auto w-14 h-14 rounded-full p-0.5 bg-zinc-800 border border-zinc-700 shadow-sm">
                          <img
                            src={avatarSrc}
                            alt="Creator Avatar"
                            onError={() => setAvatarSrc(FALLBACK_AVATAR)}
                            className="w-full h-full rounded-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#09090b] flex items-center justify-center">
                            <span className="w-1 h-1 rounded-full bg-white" />
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center justify-center gap-1">
                            <h4 className="font-semibold text-white text-xs">Khurshid N.</h4>
                            <CheckCircle2 className="w-3 h-3 text-sky-400 fill-sky-400/20" />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-400">
                            urls.uz/b/khurshid
                          </p>
                        </div>

                        <p className="text-[10px] text-zinc-400 leading-tight">
                          Tadbirkor & Veb Dasturchi. Toshkent shahrida startaplar 🚀
                        </p>

                        {/* Social Buttons */}
                        <div className="flex justify-center gap-1.5 pt-1">
                          <span className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[#229ED9] border border-zinc-700 cursor-pointer transition-colors">
                            <TelegramIcon className="w-3 h-3" />
                          </span>
                          <span className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[#E1306C] border border-zinc-700 cursor-pointer transition-colors">
                            <InstagramIcon className="w-3 h-3" />
                          </span>
                          <span className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[#FF0000] border border-zinc-700 cursor-pointer transition-colors">
                            <YouTubeIcon className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* Right Column: Links & Metrics (7 cols) */}
                      <div className="col-span-12 sm:col-span-7 space-y-2 text-left">
                        {/* Link 1 */}
                        <div className={`p-2.5 rounded-lg ${currentTheme.pinnedBg} border ${currentTheme.pinnedBorder} hover:border-zinc-600 transition-all flex items-center justify-between group cursor-pointer shadow-sm`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate">
                                🔥 Yangi Kurs & Loyihalarim
                              </div>
                              <div className="text-[10px] font-mono text-zinc-400 truncate">
                                Startup Academy
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                            1.4k
                          </span>
                        </div>

                        {/* Link 2 */}
                        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-2 min-w-0">
                            <MessageCircle className="w-3.5 h-3.5 text-[#229ED9] shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate">
                                Telegram Kanalga Qo‘shilish
                              </div>
                              <div className="text-[10px] font-mono text-zinc-400 truncate">
                                @khurshid_notes
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                            920
                          </span>
                        </div>

                        {/* Link 3 */}
                        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-2 min-w-0">
                            <Briefcase className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate">
                                Portfolio & Hamkorlik
                              </div>
                              <div className="text-[10px] font-mono text-zinc-400 truncate">
                                Rezyume va keyslar
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
                        </div>

                        {/* Stats Bar */}
                        <div className="pt-1.5 flex items-center justify-between text-[10px] text-zinc-400 px-1 border-t border-zinc-800/80 font-mono">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <TrendingUp className="w-3 h-3" />
                            <span>+38% konversiya</span>
                          </span>
                          <span>3,420 bosishlar</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Window Footer Status Line */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 px-1">
                    <span>VIEWPORT // 1024 × 768 (TABLET_DESKTOP)</span>
                    <span>HTTPS 2.0 · OK</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Live Theme Switcher */}
            <div className="flex items-center gap-2 mt-5 font-mono text-xs">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Palette className="w-3 h-3 text-zinc-400" />
                <span>PALITRA:</span>
              </span>
              {[
                { id: 'midnight' as const, label: 'Obsidian', color: 'bg-zinc-700' },
                { id: 'emerald' as const, label: 'Emerald', color: 'bg-emerald-500' },
                { id: 'indigo' as const, label: 'Indigo', color: 'bg-indigo-500' },
              ].map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setTheme(tItem.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border transition-all ${
                    theme === tItem.id
                      ? 'bg-zinc-800 text-white border-zinc-600 font-medium'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tItem.color}`} />
                  <span>{tItem.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Description & Action */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
                <span>SPEC-PORTAL · RESPONSIVE BIO ENGINE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-3">
                {locale === 'uz'
                  ? 'Barcha havolalaringiz uchun bitta mukammal portal'
                  : locale === 'ru'
                  ? 'Единая страница для всех ваших соцсетей и ссылок'
                  : 'High-converting responsive bio portal'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
                {locale === 'uz'
                  ? 'Instagram yoki TikTok profilida bitta havola bilan cheklanmang. urls.uz/b/@nomingiz orqali kanallaringiz, xizmatlaringiz va kontaktlaringizni mobil va planshetda mukammal ko‘rsating.'
                  : locale === 'ru'
                  ? 'Объедините все важные ссылки с удобной аналитикой и адаптивным отображением на телефонах и планшетах.'
                  : 'Convert profile traffic into direct channel subscribers and sales with custom branding and real-time conversion telemetry.'}
              </p>
            </div>

            {/* Feature Bullet Points (Linear Standard) */}
            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div>
                  <strong className="text-zinc-200 font-medium block">Shaxsiy brend domeni</strong>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    urls.uz/b/@username formati
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div>
                  <strong className="text-zinc-200 font-medium block">Alohida havola tahlillari</strong>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Har bir havola bo‘yicha aniq CTR va konversiya
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800">
                <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Palette className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div>
                  <strong className="text-zinc-200 font-medium block">Moslashuvchan mavzular</strong>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Obsidian, Emerald va Indigo kontrast ranglar
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href="/dashboard/bio"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <span>{t.createBioPage}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
