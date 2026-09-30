'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';
import { Check, Sparkles, Zap, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PricingSection() {
  const { locale } = useLanguage();

  const plans = [
    {
      name: locale === 'uz' ? 'Free (Hobby)' : locale === 'ru' ? 'Базовый (Free)' : 'Free (Hobby)',
      badge: 'HOZIR FAOL',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      price: '0 UZS',
      period: '/ abadiy',
      comingSoon: false,
      description: locale === 'uz'
        ? 'Shaxsiy foydalanish, loyihalar va qisqa havolalar uchun to‘liq funksiyalar'
        : locale === 'ru'
        ? 'Для личных нужд, проектов и тестирования'
        : 'For individuals, projects, and link shortening',
      specs: [
        '10 ta faol qisqa havola (Bepul)',
        'Smart Deep Links (Telegram & Instagram ilovasida ochish)',
        'Dinamik QR Kod Studio (Vektor SVG & Emodzilar)',
        'Viloyatlar va qurilmalar bo‘yicha haqiqiy analitika',
        'Havolalarga parol va amal qilish muddati o‘rnatish',
        '1,000 ta oylik qayta yo‘naltirish',
        'HTTP/3 Anycast tezkor serverlar',
      ],
      cta: locale === 'uz' ? 'Bepul boshlash' : locale === 'ru' ? 'Начать бесплатно' : 'Start Free',
      ctaHref: '/dashboard',
      popular: false,
    },
    {
      name: 'Pro (Growth)',
      badge: 'TEZ KUNDA',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      price: 'Tez kunda',
      period: '/ pullik tarif',
      comingSoon: true,
      description: locale === 'uz'
        ? 'Katta auditoriya, blogerlar va marketing kampaniyalari uchun kengaytirilgan imkoniyatlar'
        : locale === 'ru'
        ? 'Для блогеров, маркетологов и масштабных рекламных кампаний'
        : 'For content creators, marketers, and high-scale campaigns',
      specs: [
        'Cheksiz qisqa havolalar & bosishlar',
        'Link-in-Bio shaxsiy mikro-portali (@handle)',
        'CSV / Excel formatida to‘liq ma’lumotlarni eksport qilish',
        'A/B testing va avtomatlashtirilgan yo‘naltirish qoidalari',
        'Kengaytirilgan jamoaviy rollar va biriktirish',
        'Tezkor va ustuvor mijozlar qo‘llab-quvvatlashi',
      ],
      cta: locale === 'uz' ? 'Tez kunda ishga tushadi' : locale === 'ru' ? 'Скоро появится' : 'Coming Soon',
      ctaHref: '#',
      popular: true,
    },
    {
      name: locale === 'uz' ? 'Enterprise (SLA)' : locale === 'ru' ? 'Enterprise (Корпоративный)' : 'Enterprise',
      badge: 'TEZ KUNDA',
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      price: 'Tez kunda',
      period: '/ korporativ',
      comingSoon: true,
      description: locale === 'uz'
        ? 'Katta jamoalar, fintech, banklar va yuqori yuklamali infratuzilmalar uchun maxsus yechim'
        : locale === 'ru'
        ? 'Для корпоративных клиентов, финтех и интеграций'
        : 'For high-scale workloads and tech integrations',
      specs: [
        'Barcha Pro imkoniyatlari kiritilgan',
        'Shaxsiy domen ulash (custom domain CNAME)',
        'Cheksiz REST API kalitlar & Webhooklar (1,000 req/min)',
        'Jamoa a’zolarini cheksiz biriktirish',
        '< 12ms Edge Anycast prioritet kanali',
        '99.99% kafolatlangan SLA shartnomasi',
        '24/7 shaxsiy Telegram & telefon qo‘llab-quvvatlash',
      ],
      cta: locale === 'uz' ? 'Tez kunda ishga tushadi' : locale === 'ru' ? 'Скоро появится' : 'Coming Soon',
      ctaHref: '#',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-zinc-950 border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Status Indicator */}
        <div className="max-w-3xl mb-12 text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono mb-3">
            <span>TRANSPARENT SPECIFICATIONS</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
                {locale === 'uz'
                  ? 'Shaffof va aniq tariflar rejasi'
                  : locale === 'ru'
                  ? 'Прозрачные и понятные тарифы'
                  : 'Transparent & Localized Pricing'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                {locale === 'uz'
                  ? 'Hozirda bepul tarif barcha uchun 10 ta havola bilan to‘liq faol. Kengaytirilgan pulli tariflar tez kunda ishga tushadi.'
                  : locale === 'ru'
                  ? 'Сейчас бесплатная версия полностью доступна с 10 ссылками. Платные тарифы запустятся в скором времени.'
                  : 'Free tier is currently fully available with 10 links limit. Paid tiers will launch soon.'}
              </p>
            </div>

            {/* Launch Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hozirda Bepul versiya faol</span>
            </div>
          </div>
        </div>

        {/* 3-Column Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                p.popular
                  ? 'bg-zinc-900/60 border-zinc-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.5)]'
                  : 'bg-zinc-900/30 border-zinc-800 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]'
              }`}
            >
              <div>
                {/* Meta header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4 text-[11px] font-mono">
                  <span className="font-semibold text-zinc-100">{p.name}</span>
                  {p.badge && (
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Price or Coming Soon */}
                <div className="mb-4">
                  {p.comingSoon ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
                          {p.price}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">{p.period}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        To‘lov tizimlari orqali tez kunda ulanadi
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-white tabular-nums">
                        {p.price}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{p.period}</span>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Specs List */}
                <div className="py-4 border-t border-zinc-800/80 space-y-2.5 text-xs font-mono">
                  {p.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2 text-zinc-300">
                      {p.comingSoon ? (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      )}
                      <span className={`text-[11px] ${sIdx === 0 && !p.comingSoon ? 'text-white font-semibold' : ''}`}>
                        {spec}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-zinc-800/80 mt-6">
                {p.comingSoon ? (
                  <div className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed select-none">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{p.cta}</span>
                  </div>
                ) : (
                  <Link
                    href={p.ctaHref}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md active:scale-98"
                  >
                    <Zap className="w-3.5 h-3.5 text-zinc-950" />
                    <span>{p.cta}</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
