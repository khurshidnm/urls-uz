'use client';

import { PLAN_FEATURES, PLANNED_FEATURES } from '@/lib/plan-features';
import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import {
  CreditCard,
  Check,
  Sparkles,
  ShieldCheck,
  Receipt,
  Lock,
  Zap,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';

export default function BillingClient() {
  const { user } = useAuth();
  const { locale, tr } = useLanguage();

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('Pro');

  const plans = [
    {
      id: 'free',
      name: tr('Free (Hobby)', 'Базовый (Free)', 'Free (Hobby)'),
      badge: tr('HOZIR FAOL', 'ДОСТУПЕН', 'AVAILABLE NOW'),
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
      price: '0 UZS',
      period: tr('/ abadiy', '/ навсегда', '/ forever'),
      comingSoon: false,
      popular: false,
      description: tr('Shaxsiy foydalanish va qisqa havolalar uchun asosiy imkoniyatlar', 'Для личных нужд и сокращения ссылок', 'The essentials for personal use and short links'),
      features: PLAN_FEATURES[locale].free,
    },
    {
      id: 'pro',
      name: 'Pro (Growth)',
      badge: tr('TEZ KUNDA', 'СКОРО', 'COMING SOON'),
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
      price: tr('Tez kunda', 'Скоро', 'Soon'),
      period: tr('/ pullik tarif', '/ платный тариф', '/ paid plan'),
      comingSoon: true,
      popular: true,
      description: tr('Katta auditoriya, blogerlar va marketing kampaniyalari uchun', 'Для блогеров и масштабных кампаний', 'For creators, marketers and large campaigns'),
      features: PLAN_FEATURES[locale].pro,
    },
    {
      id: 'enterprise',
      name: tr('Biznes', 'Бизнес', 'Business'),
      badge: tr('TEZ KUNDA', 'СКОРО', 'COMING SOON'),
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      price: tr('Tez kunda', 'Скоро', 'Soon'),
      period: tr('/ korporativ', '/ корпоративный', '/ corporate'),
      comingSoon: true,
      popular: false,
      description: tr('Tashkilotlar uchun: Pro imkoniyatlari va alohida shartlar', 'Для организаций: возможности Pro и особые условия', 'For organisations: everything in Pro and custom terms'),
      features: PLAN_FEATURES[locale].enterprise,
    },
  ];

  const handleOpenInfo = (planName: string) => {
    setSelectedPlanName(planName);
    setInfoModalOpen(true);
  };

  const isFreePlan = !user?.plan || user?.plan === 'free';

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">{tr('Tarif & Xizmatlar', 'Тариф и услуги', 'Plan & billing')}</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          {tr('Hozirda bepul versiya barcha uchun 10 ta faol havola bilan faol. Kengaytirilgan pulli tariflar tez kunda ishga tushadi.', 'Сейчас всем доступна бесплатная версия с 10 активными ссылками. Платные тарифы скоро появятся.', 'The free plan with 10 active links is available to everyone. Paid plans launch soon.')}
        </p>
      </div>

      {/* Current Plan Overview Banner */}
      <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-bold text-sm font-mono shadow-sm">
            {isFreePlan ? 'FREE' : user?.plan?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">
                {isFreePlan ? tr('Bepul (Free) tarif', 'Бесплатный тариф (Free)', 'Free plan') : tr(`${user?.plan} tarif`, `Тариф ${user?.plan}`, `${user?.plan} plan`)}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                HOZIR FAOL
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              {tr('Limit: 10 ta faol havola · Abadiy bepul · To‘lov talab etilmaydi', 'Лимит: 10 активных ссылок · Бесплатно навсегда · Без оплаты', 'Limit: 10 active links · Free forever · No payment needed')}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{tr('Pullik tariflar tez kunda ulanadi', 'Платные тарифы скоро появятся', 'Paid plans coming soon')}</span>
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = isFreePlan ? p.id === 'free' : user?.plan === p.id;

          return (
            <div
              key={p.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                p.popular
                  ? 'bg-zinc-900/60 border-zinc-700 shadow-lg'
                  : 'bg-zinc-900/30 border-zinc-800/90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-white">{p.name}</h4>
                  {p.badge && (
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Price display: prices hidden for paid tiers */}
                <div className="mb-4">
                  {p.comingSoon ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
                        {p.price}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{p.period}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
                        {p.price}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{p.period}</span>
                    </div>
                  )}
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{p.description}</p>
                </div>

                <div className="space-y-2.5 mb-6 pt-4 border-t border-zinc-800/80">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      {p.comingSoon ? (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      )}
                      <span className="text-[11px] leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {p.comingSoon ? (
                <button
                  type="button"
                  onClick={() => handleOpenInfo(p.name)}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{tr('Tez kunda ishga tushadi', 'Скоро появится', 'Coming soon')}</span>
                </button>
              ) : isCurrent ? (
                <div className="w-full py-2.5 px-3 text-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-mono flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{tr('Amaldagi faol tarif', 'Ваш текущий тариф', 'Your current plan')}</span>
                </div>
              ) : (
                <div className="w-full py-2.5 text-center text-xs text-zinc-500 font-semibold bg-zinc-900 rounded-xl">
                  {tr('Tanlangan', 'Выбран', 'Selected')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Not built yet: listed as planned, never as included in a plan */}
      <p className="text-[11px] font-mono text-zinc-500">{tr('Rejada (hali mavjud emas)', 'В планах (пока нет)', 'Planned (not available yet)')}: {PLANNED_FEATURES[locale].join(' · ')}</p>

      {/* Info Modal for Coming Soon Plans */}
      <Modal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title={tr('Pullik tariflar haqida', 'О платных тарифах', 'About paid plans')}
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white mb-1.5">
              {selectedPlanName} — {tr('Tez kunda ishga tushadi!', 'Скоро появится!', 'Coming soon!')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
              {tr(
                'Hozirda barcha foydalanuvchilar uchun bepul versiya 10 ta havola bilan to‘liq ochiq. Payme, Click va Uzum Bank orqali rasmiy to‘lov shlyuzlari integratsiya qilingach, pullik tariflar taqdim etiladi.',
                'Сейчас всем пользователям полностью доступна бесплатная версия с 10 ссылками. Платные тарифы появятся после подключения Payme, Click и Uzum Bank.',
                'The free plan with 10 links is fully open to everyone. Paid plans arrive once Payme, Click and Uzum Bank payments are connected.'
              )}
            </p>
          </div>

          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-left text-xs space-y-1.5 text-zinc-300">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{tr('Pro tarif imkoniyatlari:', 'Возможности тарифа Pro:', 'What Pro includes:')}</span>
            </div>
            <ul className="text-[11px] text-zinc-400 list-disc list-inside">
              {PLAN_FEATURES[locale].pro.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setInfoModalOpen(false)}
            className="w-full py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-xl transition-colors"
          >
            {tr('Tushundim', 'Понятно', 'Got it')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
