'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { User, Shield, Globe, Save, Check, RotateCcw } from 'lucide-react';
import { Locale } from '@/lib/translations';

export default function SettingsClient({ loginMethods }: { loginMethods?: React.ReactNode }) {
  const {
    user,
    isSuperAdmin,
    demoEditMode,
    setDemoEditMode,
    resetDemoData,
  } = useAuth();
  const { locale, setLocale, t } = useLanguage();

  const [name, setName] = useState(user?.name || (user ? 'Foydalanuvchi' : 'ApexTech Solutions'));
  const [email, setEmail] = useState(user?.email || (user ? 'user@urls.uz' : 'demo@apextech.uz'));
  const [customDomain, setCustomDomain] = useState('go.apextech.uz');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !isSuperAdmin) {
      window.dispatchEvent(
        new CustomEvent('open-demo-restriction', { detail: { actionTitle: 'Sozlamalarni saqlash' } })
      );
      return;
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">{t.settings}</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Profilingiz, til va shaxsiy domen sozlamalari
        </p>
      </div>

      {loginMethods}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Details */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Profil maʼlumotlari</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ism-familiya</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email manzil</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <Globe className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Interfeys tili</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { code: 'uz' as Locale, label: "O'zbekcha", flag: '🇺🇿' },
              { code: 'ru' as Locale, label: 'Русский', flag: '🇷🇺' },
              { code: 'en' as Locale, label: 'English', flag: '🇬🇧' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLocale(lang.code)}
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  locale === lang.code
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Domain (Biznes Plan) */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Shaxsiy Brend Domeni (Custom Domain)</h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              BIZNES
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Domen manzili (CNAME urls.uz ga yo‘naltiriladi)
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="go.sizningkompaniya.uz"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              DNS provayderingizda CNAME yozuvi orqali <code>cname.urls.uz</code> manziliga ulang.
            </p>
          </div>
        </div>

        {/* Super Admin & Demo Boshqaruvi — admin role is assigned server-side (ADMIN_EMAILS / ADMIN_TELEGRAM_IDS) */}
        {isSuperAdmin && (
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 to-transparent space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Super Admin & Demo Rejimi Boshqaruvi</h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isSuperAdmin
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {isSuperAdmin ? 'SUPER ADMIN (FAOL)' : 'MA’MURIYAT'}
            </span>
          </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    Demo Maʼlumotlarini Tahrirlash Rejimi
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-md leading-relaxed">
                    Yoqilganda, siz yaratgan yoki tahrirlagan havolalar va bio sahifa barcha yangi mehmonlar uchun Demo sifatida aks etadi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDemoEditMode(!demoEditMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    demoEditMode
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {demoEditMode ? 'Tahrirlash Rejimi: FAOL' : 'Tahrirlashni Yoqish'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">Demo Maʼlumotlarini Asl Holatiga Qaytarish</h4>
                  <p className="text-[11px] text-zinc-400 mt-1 max-w-md leading-relaxed">
                    «ApexTech Solutions» kompaniyasining dastlabki 6 ta havolasi, bio sahifasi va viloyatlar telemetriyasini toza holatda qayta generatsiya qiladi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Haqiqatan ham barcha Demo maʼlumotlarini asl holatiga qaytarmoqchimisiz?')) return;
                    setIsResetting(true);
                    await resetDemoData();
                    setIsResetting(false);
                  }}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-zinc-400 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Qaytarilmoqda...' : 'Dastlabki Holatga Qaytarish (Reset)'}</span>
                </button>
              </div>
            </div>
        </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-btn text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Saqlandi!' : t.save}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
