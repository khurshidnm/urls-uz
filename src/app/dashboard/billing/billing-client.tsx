'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import {
  CreditCard,
  Check,
  Sparkles,
  ShieldCheck,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import confetti from 'canvas-confetti';

export default function BillingClient() {
  const { user, updatePlan } = useAuth();
  const { t, locale } = useLanguage();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [paymentProvider, setPaymentProvider] = useState<'click' | 'payme' | 'uzum' | 'card'>('payme');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Bepul Plan',
      price: '0 UZS / abadiy',
      features: ['50 ta qisqa havola', '1,000 oylik bosishlar', 'Standart QR-kodlar', 'Asosiy analitika'],
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '49,000 UZS / oy',
      popular: true,
      features: [
        'Cheksiz qisqa havolalar',
        'Smart Deep Links (Telegram & Instagram)',
        'Dinamik QR Studio (logotip & ramkalar)',
        'Link-in-Bio @handle shaxsiy sahifa',
        'O‘zbekiston viloyatlari analitikasi',
        'Parol bilan himoyalash & amal muddati',
      ],
    },
    {
      id: 'enterprise',
      name: 'Biznes Plan',
      price: '149,000 UZS / oy',
      features: [
        'Barcha Pro imkoniyatlari',
        'REST API kalitlar & Webhooks',
        'Shaxsiy domen ulash (custom domain)',
        '5 ta jamoa aʼzosi',
        '24/7 shaxsiy Telegram qo‘llab-quvvatlash',
      ],
    },
  ];

  const handleOpenCheckout = (planId: 'pro' | 'enterprise') => {
    setSelectedPlan(planId);
    setCheckoutModalOpen(true);
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      updatePlan(selectedPlan);
      setIsProcessing(false);
      setCheckoutModalOpen(false);

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Tarif & To‘lovlar</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Hozirgi faol tarifingizni boshqaring va O‘zbekiston to‘lov tizimlari orqali xizmatlarni yangilang
        </p>
      </div>

      {/* Current Plan Overview Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-indigo-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-600/30">
            {user?.plan?.toUpperCase() || 'PRO'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white capitalize">{user?.plan || 'pro'} Tarif</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                FAOL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Avtomatik yangilanish: Keyingi oy 29-sana</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenCheckout(user?.plan === 'pro' ? 'enterprise' : 'pro')}
            className="px-4 py-2 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-md"
          >
            Tarifni o‘zgartirish
          </button>
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = user?.plan === p.id;

          return (
            <div
              key={p.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-bold text-white">{p.name}</h4>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      HOZIRGI
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-white font-mono mb-4">{p.price}</div>

                <div className="space-y-2.5 mb-6">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isCurrent ? (
                <button
                  onClick={() => handleOpenCheckout(p.id as any)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Ushbu tarifga o‘tish
                </button>
              ) : (
                <div className="w-full py-2.5 text-center text-xs text-slate-500 font-semibold bg-slate-900 rounded-xl">
                  Amaldagi tarif
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="O‘zbekiston to‘lov tizimlari orqali to‘lov"
      >
        <div className="space-y-5">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white capitalize">{selectedPlan} Tarif (1 oylik obuna)</div>
              <div className="text-[11px] text-slate-400">Barcha premium imkoniyatlar ochiladi</div>
            </div>
            <div className="text-sm font-bold text-indigo-400 font-mono">
              {selectedPlan === 'pro' ? '49,000 UZS' : '149,000 UZS'}
            </div>
          </div>

          {/* Payment providers selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              To‘lov usulini tanlang:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentProvider('payme')}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  paymentProvider === 'payme'
                    ? 'bg-teal-950/40 border-teal-500 text-teal-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <span>PAYME</span>
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              </button>

              <button
                type="button"
                onClick={() => setPaymentProvider('click')}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  paymentProvider === 'click'
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <span>CLICK</span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              </button>

              <button
                type="button"
                onClick={() => setPaymentProvider('uzum')}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  paymentProvider === 'uzum'
                    ? 'bg-purple-950/40 border-purple-500 text-purple-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <span>UZUM BANK</span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              </button>

              <button
                type="button"
                onClick={() => setPaymentProvider('card')}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  paymentProvider === 'card'
                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <span>KARTA (UZCARD / HUMO)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2"
            >
              <span>
                {isProcessing
                  ? 'To‘lov tasdiqlanmoqda...'
                  : `${paymentProvider.toUpperCase()} orqali to‘lash`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
