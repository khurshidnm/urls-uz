'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { User, Shield, Globe, Save, Check, RotateCcw } from 'lucide-react';
import { Locale } from '@/lib/translations';
import { useToast } from '@/components/ui/toast';

interface Props {
  loginMethods?: React.ReactNode;
  /** The logged-in user's profile (null for demo visitors). */
  profile: { name: string; email: string | null; phone: string | null } | null;
}

export default function SettingsClient({ loginMethods, profile }: Props) {
  const { isSuperAdmin, demoEditMode, setDemoEditMode, resetDemoData, reloadUser } = useAuth();
  const { locale, setLocale, t, tr } = useLanguage();
  const { showToast } = useToast();

  const [name, setName] = useState(profile?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast('error', data.error || tr('Saqlab bo‘lmadi', 'Не удалось сохранить', 'Couldn’t save'));
        return;
      }
      setName(data.user.name);
      // The sidebar shows the name too
      await reloadUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      showToast('error', 'Tarmoq xatosi yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">{t.settings}</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">{tr('Kirish usullari, xavfsizlik, profil va til', 'Способы входа, безопасность, профиль и язык', 'Sign-in methods, security, profile and language')}</p>
      </div>

      {loginMethods}

      {profile && (
        <form onSubmit={saveProfile} className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">{tr('Profil maʼlumotlari', 'Профиль', 'Profile')}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                {tr('Ism-familiya', 'Имя и фамилия', 'Full name')}
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                maxLength={80}
                required
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-300 mb-1.5">{tr('Email va telefon', 'Email и телефон', 'Email and phone')}</span>
              <div className="px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
                {[profile.email, profile.phone].filter(Boolean).join(' · ') || '—'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{tr('Google va telefon raqam «Kirish usullari» orqali ulanadi.', 'Google и номер телефона подключаются в разделе «Способы входа».', 'Google and your phone number are connected under “Sign-in methods”.')}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim() || name.trim() === profile.name}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-btn text-white text-xs font-semibold rounded-xl disabled:opacity-50"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? tr('Saqlandi!', 'Сохранено!', 'Saved!') : t.save}</span>
            </button>
          </div>
        </form>
      )}

      {/* Language: applies immediately */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">{tr('Interfeys tili', 'Язык интерфейса', 'Interface language')}</h3>
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
              aria-pressed={locale === lang.code}
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

      {/* Demo management — the admin role is assigned server-side (ADMIN_EMAILS / ADMIN_TELEGRAM_IDS / ADMIN_PHONES) */}
      {isSuperAdmin && (
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 to-transparent space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Super Admin & Demo Rejimi Boshqaruvi</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30">
              SUPER ADMIN
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
                  «ApexTech Solutions» namunaviy havolalari, bio sahifasi va statistikasini toza holatda qayta yaratadi.
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
    </div>
  );
}
