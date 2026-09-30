'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import ShortenCard from './shorten-card';
import { Zap, Smartphone, MapPin, Shield, Terminal, Sparkles } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function Hero({ totalRedirects }: { totalRedirects: number }) {
  const { t, locale } = useLanguage();

  const highlights = [
    { icon: Zap, label: 'SMART ROUTING', value: 'iOS · Android · Huawei' },
    { icon: Smartphone, label: 'DEEP LINKING', value: 'Zero-Webview Bypass' },
    { icon: MapPin, label: 'GEO-TELEMETRY', value: '14 Viloyat Real-time' },
    { icon: Shield, label: 'LINK ARMOR', value: 'Parol & Rate Limiting' },
  ];

  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-mesh border-b border-zinc-800/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Engineering Release Pill & Live Demo Button */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300 font-semibold">urls.uz</span>
            <span className="text-zinc-600">·</span>
            <span>{formatNumber(totalRedirects)} Redirects Processed</span>
          </div>

          <Link
            href="/dashboard?demo=true"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono transition-all group"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Jonli Demo Versiya (Faqat ko‘rish)</span>
            <span className="text-amber-400/80 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Hero Title (Confident, tight, weight 600, no blobby bold) */}
        <h1 className="text-3xl sm:text-5xl lg:text-5xl font-semibold tracking-tight text-white max-w-3xl mx-auto leading-[1.15] mb-5 text-balance font-sans">
          {locale === 'uz' ? (
            <>
              Yuqori tezlikdagi havola va <br className="hidden sm:inline" />
              <span className="text-zinc-400">dinamik QR infratuzilmasi</span>
            </>
          ) : locale === 'ru' ? (
            <>
              Высокопроизводительная инфраструктура <br className="hidden sm:inline" />
              <span className="text-zinc-400">коротких ссылок и QR</span>
            </>
          ) : (
            <>
              High-throughput link routing and <br className="hidden sm:inline" />
              <span className="text-zinc-400">dynamic QR infrastructure</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-9 leading-relaxed">
          {locale === 'uz'
            ? 'Oddiy havolalarni <14ms kechikishdagi smart deep linklarga, brendlangan QR kodlarga va shaxsiy Link-in-Bio sahifalariga aylantiring.'
            : locale === 'ru'
            ? 'Создавайте быстрые диплинки с задержкой <14мс, векторные QR-коды и визитки Link-in-Bio с подробной аналитикой.'
            : 'Turn destination URLs into sub-14ms smart deep links, vector QR codes, and bio portals with regional telemetry.'}
        </p>

        {/* Omni-Shortener Command Bar */}
        <div className="mb-12">
          <ShortenCard />
        </div>

        {/* Engineering Metric Tickers */}
        <div className="pt-6 border-t border-zinc-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-left transition-colors hover:border-zinc-700/80"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">
                  <Icon className="w-3 h-3 text-zinc-400" />
                  <span>{item.label}</span>
                </div>
                <div className="text-xs font-mono font-medium text-zinc-200 truncate">
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
