'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Check, Sparkles, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PricingSection() {
  const { locale, t } = useLanguage();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: locale === 'uz' ? 'Bepul' : locale === 'ru' ? 'Бесплатный' : 'Free',
      badge: null,
      priceMonth: '0',
      period: locale === 'uz' ? 'UZS / abadiy' : locale === 'ru' ? 'UZS / навсегда' : 'UZS / forever',
      description: locale === 'uz'
        ? 'Shaxsiy foydalanish va oddiy havolalar uchun'
        : locale === 'ru'
        ? 'Для личных нужд и базовых коротких ссылок'
        : 'For individuals and basic short link needs',
      features: [
        '50 ta qisqa havola',
        '1,000 ta oylik bosishlar',
        'Standart QR kodlar',
        '7 kunlik analitika tarixi',
        'Standart yo‘naltirish',
      ],
      cta: locale === 'uz' ? 'Bepul boshlash' : locale === 'ru' ? 'Начать бесплатно' : 'Start Free',
      popular: false,
    },
    {
      name: 'Pro',
      badge: locale === 'uz' ? 'ENG OMMABOP' : locale === 'ru' ? 'ПОПУЛЯРНЫЙ' : 'MOST POPULAR',
      priceMonth: billingPeriod === 'monthly' ? '49,000' : '39,000',
      period: locale === 'uz' ? `UZS / ${t.month}` : locale === 'ru' ? `UZS / ${t.month}` : `UZS / ${t.month}`,
      description: locale === 'uz'
        ? 'Blogerlar, sotuvchilar va biznes egalari uchun'
        : locale === 'ru'
        ? 'Для блогеров, маркетологов и онлайн-магазинов'
        : 'For content creators, marketers and business',
      features: [
        'Cheksiz qisqa havolalar',
        'Cheksiz bosishlar va qayta yo‘naltirish',
        'Smart Deep Links (Telegram & Instagram)',
        'Dinamik QR Studio (logotip & ramkalar)',
        'Link-in-Bio shaxsiy sahifa (@handle)',
        'O‘zbekiston viloyatlari bo‘yicha analitika',
        'Parol va amal qilish muddati chegaralari',
        'CSV formatida eksport qilish',
      ],
      cta: locale === 'uz' ? 'Pro-ga o‘tish' : locale === 'ru' ? 'Выбрать Pro' : 'Upgrade to Pro',
      popular: true,
    },
    {
      name: locale === 'uz' ? 'Biznes' : locale === 'ru' ? 'Бизнес' : 'Enterprise',
      badge: null,
      priceMonth: billingPeriod === 'monthly' ? '149,000' : '119,000',
      period: locale === 'uz' ? `UZS / ${t.month}` : locale === 'ru' ? `UZS / ${t.month}` : `UZS / ${t.month}`,
      description: locale === 'uz'
        ? 'Katta kompaniyalar va dasturiy taʼminotlar uchun'
        : locale === 'ru'
        ? 'Для крупных компаний, финтеха и интеграций'
        : 'For growing businesses and tech integrations',
      features: [
        'Barcha Pro imkoniyatlari',
        'REST API kalitlar & Webhooks',
        'Shaxsiy brend domeni (custom domain)',
        'Jamoaviy boshqaruv (5 tagacha foydalanuvchi)',
        'Maksimal tezlikdagi Edge Redirection',
        '24/7 shaxsiy Telegram qo‘llab-quvvatlash',
        '99.99% kafolatlangan SLA',
      ],
      cta: locale === 'uz' ? 'Biznesni tanlash' : locale === 'ru' ? 'Выбрать Бизнес' : 'Choose Enterprise',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-slate-950/40 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.pricing}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {locale === 'uz'
              ? 'Shaffof va hamyonbop tariflar'
              : locale === 'ru'
              ? 'Прозрачные и доступные тарифы'
              : 'Transparent & Localized Pricing'}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
            {locale === 'uz'
              ? 'O‘zbekiston so‘mida (UZS) qulay to‘lov: Payme, Click, Uzum yoki xalqaro kartalar orqali to‘lang.'
              : locale === 'ru'
              ? 'Оплата в сумах через популярные платежные системы Узбекистана: Payme, Click, Uzum или картами.'
              : 'Pay in Uzbek Soums (UZS) via Payme, Click, Uzum Bank, or international cards.'}
          </p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {locale === 'uz' ? 'Oylik to‘lov' : locale === 'ru' ? 'Ежемесячно' : 'Monthly'}
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingPeriod === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{locale === 'uz' ? 'Yillik' : locale === 'ru' ? 'Ежегодно' : 'Yearly'}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                p.popular
                  ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900/90 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 scale-100 lg:-translate-y-2'
                  : 'bg-slate-900/60 border border-white/10 hover:border-slate-700'
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold tracking-wider shadow-lg">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                  <p className="text-xs text-slate-400 min-h-[32px]">{p.description}</p>
                </div>

                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-white/5">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono">{p.priceMonth}</span>
                  <span className="text-xs text-slate-400 font-medium">{p.period}</span>
                </div>

                <div className="space-y-3 mb-8">
                  {p.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/dashboard/billing"
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-center transition-all ${
                  p.popular
                    ? 'bg-gradient-btn text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Local Payment Badges */}
        <div className="mt-14 pt-8 border-t border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Qabul qilinadigan to‘lov turlari:</span>
          <div className="flex items-center gap-4 text-white font-bold tracking-wider">
            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-cyan-400">CLICK</span>
            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-teal-400">PAYME</span>
            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-purple-400">UZUM</span>
            <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-slate-200">VISA / MASTERCARD</span>
          </div>
        </div>
      </div>
    </section>
  );
}
