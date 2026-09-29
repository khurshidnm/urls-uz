'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';

export default function StatsBand() {
  const { locale } = useLanguage();

  const stats = [
    {
      value: '40,698,620+',
      label: locale === 'uz' ? 'Qisqa havolalar' : locale === 'ru' ? 'Сокращенных ссылок' : 'Links Shortened',
      change: locale === 'uz' ? '40 milliondan ortiq havola' : locale === 'ru' ? 'Более 40 млн ссылок' : 'Over 40 million links',
      highlight: true,
    },
    {
      value: '500M+',
      label: locale === 'uz' ? 'Jami bosishlar' : locale === 'ru' ? 'Всего переходов' : 'Clicks Tracked',
      change: locale === 'uz' ? 'O‘zbekiston va butun dunyo' : locale === 'ru' ? 'Узбекистан и весь мир' : 'Uzbekistan & Global',
      highlight: false,
    },
    {
      value: '99.99%',
      label: locale === 'uz' ? 'Uzluksiz ishlash' : locale === 'ru' ? 'Аптайм платформы' : 'Uptime SLA',
      change: 'High-availability cluster',
      highlight: false,
    },
    {
      value: '< 30ms',
      label: locale === 'uz' ? 'Yo‘naltirish tezligi' : locale === 'ru' ? 'Скорость редиректа' : 'Redirect Speed',
      change: 'Sub-30ms Edge Engine',
      highlight: false,
    },
  ];

  return (
    <section className="border-y border-white/5 bg-slate-950/60 backdrop-blur-md py-10 relative overflow-hidden">
      {/* Background glow behind 40M+ */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-72 h-32 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((item, idx) => (
            <div key={idx} className="text-center md:text-left">
              <div
                className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1 font-mono ${
                  item.highlight
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400'
                    : 'text-white'
                }`}
              >
                {item.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-200 mb-0.5">
                {item.label}
              </div>
              <div className="text-[11px] text-indigo-400 font-medium">
                {item.change}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
