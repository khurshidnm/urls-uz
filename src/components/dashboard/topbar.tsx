'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { Plus, Globe, Bell, Sparkles } from 'lucide-react';
import CreateLinkModal from './create-link-modal';
import { Locale } from '@/lib/translations';

export default function Topbar() {
  const { locale, setLocale, t } = useLanguage();
  const { user } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const locales: { code: Locale; label: string; flag: string }[] = [
    { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <>
      <header className="h-16 bg-slate-950/40 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 backdrop-blur-md">
        {/* Left Side: System status & domain badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-400 font-medium">Domen:</span>
            <span className="font-semibold text-white">urls.uz</span>
          </div>
        </div>

        {/* Right Side: Global New Link + Locale + Plan */}
        <div className="flex items-center gap-3">
          {/* Quick Create Link Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-btn rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createNewLink}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{locales.find((l) => l.code === locale)?.flag}</span>
              <span className="uppercase font-semibold">{locale}</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 py-1 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 z-50">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                    locale === l.code ? 'bg-indigo-600/20 text-indigo-400 font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Global Link Modal */}
      <CreateLinkModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </>
  );
}
