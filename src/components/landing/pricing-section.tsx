'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Check, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function PricingSection() {
  const { locale, t } = useLanguage();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: locale === 'uz' ? 'Free (Hobby)' : locale === 'ru' ? 'Базовый (Free)' : 'Free (Hobby)',
      badge: null,
      priceMonth: '0',
      period: 'UZS / abadiy',
      description: locale === 'uz'
        ? 'Shaxsiy foydalanish va oddiy havolalar uchun'
        : locale === 'ru'
        ? 'Для личных нужд и тестирования'
        : 'For individuals and basic link shortening',
      specs: [
        '50 ta faol qisqa havola',
        '1,000 ta oylik qayta yo‘naltirish',
        'Standart QR kod generatsiyasi',
        '7 kunlik analitika jurnali',
        'HTTP/3 Anycast yo‘naltirish',
      ],
      cta: locale === 'uz' ? 'Bepul boshlash' : locale === 'ru' ? 'Начать бесплатно' : 'Start Free',
      popular: false,
    },
    {
      name: 'Pro (Growth)',
      badge: 'POPULAR CHOICE',
      priceMonth: billingPeriod === 'monthly' ? '49,000' : '39,000',
      period: `UZS / ${t.month}`,
      description: locale === 'uz'
        ? 'Blogerlar, brendlar va marketing kampaniyalari uchun'
        : locale === 'ru'
        ? 'Для блогеров, маркетологов и онлайн-бизнеса'
        : 'For content creators, marketers, and brands',
      specs: [
        'Cheksiz qisqa havolalar & bosishlar',
        'Smart Deep Links (Telegram, Instagram, YT)',
        'Dinamik QR Studio (Vektor SVG & Logotiplar)',
        'Link-in-Bio shaxsiy mikro-portali (@handle)',
        '14 ta viloyat bo‘yicha batafsil analitika',
        'Parol va amal qilish muddati siyosati',
        'CSV/Excel formatida eksport',
      ],
      cta: locale === 'uz' ? 'Pro-ga ulanish' : locale === 'ru' ? 'Выбрать Pro' : 'Upgrade to Pro',
      popular: true,
    },
    {
      name: locale === 'uz' ? 'Enterprise (SLA)' : locale === 'ru' ? 'Enterprise (Корпоративный)' : 'Enterprise',
      badge: null,
      priceMonth: billingPeriod === 'monthly' ? '149,000' : '119,000',
      period: `UZS / ${t.month}`,
      description: locale === 'uz'
        ? 'Katta jamoalar, fintech va yuqori yuklamali tizimlar uchun'
        : locale === 'ru'
        ? 'Для корпоративных клиентов и интеграций'
        : 'For high-scale workloads and tech integrations',
      specs: [
        'Barcha Pro imkoniyatlari kiritilgan',
        'REST API kalitlar (1,000 req/min)',
        'Shaxsiy domen (custom domain CNAME)',
        '5 tagacha jamoa a’zolari',
        '< 12ms Edge Anycast prioritet kanali',
        '99.99% kafolatlangan SLA shartnomasi',
        '24/7 shaxsiy Telegram qo‘llab-quvvatlash',
      ],
      cta: locale === 'uz' ? 'Biznesni tanlash' : locale === 'ru' ? 'Выбрать Бизнес' : 'Choose Enterprise',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-zinc-950 border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Billing Period Switcher */}
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
                O‘zbekiston so‘mida (UZS) qulay to‘lov: Payme, Click, Uzum yoki xalqaro kartalar orqali.
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono shrink-0">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-zinc-800 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Oylik to‘lov
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  billingPeriod === 'yearly'
                    ? 'bg-zinc-800 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Yillik (-20%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Column Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-xl border flex flex-col justify-between transition-all ${
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
                    <span className="px-1.5 py-0.5 rounded bg-white text-zinc-950 font-bold text-[10px]">
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-white tabular-nums">
                      {p.priceMonth}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">{p.period}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                {/* Specs List */}
                <div className="py-4 border-t border-zinc-800/80 space-y-2.5 text-xs font-mono">
                  {p.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-[11px]">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-zinc-800/80 mt-6">
                <Link
                  href="/dashboard/billing"
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    p.popular
                      ? 'bg-white text-zinc-950 hover:bg-zinc-200'
                      : 'bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-200'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
