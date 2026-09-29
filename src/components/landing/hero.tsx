'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';
import ShortenCard from './shorten-card';
import { Zap, Smartphone, MapPin, Sparkles } from 'lucide-react';

export default function Hero() {
  const { t, locale } = useLanguage();

  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Badges */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{locale === 'uz' ? 'Yangi avlod urls.uz platformasi' : locale === 'ru' ? 'Новое поколение urls.uz' : 'Next-Gen urls.uz Platform'}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15] mb-6">
          {locale === 'uz' ? (
            <>
              Havolalarni qisqartiring, <span className="text-gradient-primary">QR kodlar</span> va <span className="text-gradient-emerald">Bio sahifalar</span> yarating
            </>
          ) : locale === 'ru' ? (
            <>
              Сокращайте ссылки, создавайте <span className="text-gradient-primary">QR-коды</span> и <span className="text-gradient-emerald">Link-in-Bio</span>
            </>
          ) : (
            <>
              Shorten Links, Generate <span className="text-gradient-primary">Branded QRs</span> & Build <span className="text-gradient-emerald">Bio Pages</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* Hero Shorten Card */}
        <ShortenCard />

        {/* Feature Highlights Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>&lt; 30ms ultra tezkor yo‘naltirish</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telegram & Instagram Deep Link</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>O‘zbekiston viloyatlari analitikasi</span>
          </div>
        </div>
      </div>
    </section>
  );
}
