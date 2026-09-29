'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';

export default function StatsBand() {
  const { locale } = useLanguage();

  const stats = [
    {
      value: '120M+',
      label: locale === 'uz' ? 'Jami bosishlar' : locale === 'ru' ? 'Всего переходов' : 'Clicks Tracked',
      change: '+24% bu oy',
    },
    {
      value: '450K+',
      label: locale === 'uz' ? 'Qisqa havolalar' : locale === 'ru' ? 'Коротких ссылок' : 'Links Created',
      change: '14 viloyatda faol',
    },
    {
      value: '99.99%',
      label: locale === 'uz' ? 'Uzluksiz ishlash' : locale === 'ru' ? 'Аптайм платформы' : 'Uptime SLA',
      change: 'High-availability',
    },
    {
      value: '< 30ms',
      label: locale === 'uz' ? 'Yo‘naltirish tezligi' : locale === 'ru' ? 'Скорость редиректа' : 'Redirect Speed',
      change: 'Global Edge',
    },
  ];

  return (
    <section className="border-y border-white/5 bg-slate-950/40 backdrop-blur-md py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((item, idx) => (
            <div key={idx} className="text-center md:text-left">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-1 font-mono">
                {item.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mb-0.5">
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
