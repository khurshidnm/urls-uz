'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { Globe, ArrowRight, Menu, X, Sparkles, Link2 } from 'lucide-react';
import { Locale } from '@/lib/translations';

export default function Navbar() {
  const { locale, setLocale, t } = useLanguage();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const locales: { code: Locale; label: string; flag: string }[] = [
    { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#090d16]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Link2 className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
            urls<span className="text-indigo-400">.uz</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            v2.0
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
          <a href="#features" className="hover:text-white transition-colors">
            {locale === 'uz' ? 'Imkoniyatlar' : locale === 'ru' ? 'Возможности' : 'Features'}
          </a>
          <a href="#qr-studio" className="hover:text-white transition-colors">
            {t.qrStudio}
          </a>
          <a href="#bio-builder" className="hover:text-white transition-colors">
            {t.bioPages}
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            {t.pricing}
          </a>
          <Link href="/dashboard/api-keys" className="hover:text-white transition-colors">
            API
          </Link>
        </nav>

        {/* Actions & Locale Selector */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition-colors">
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

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-btn rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <span>{t.dashboard}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-slate-900/95 border-b border-slate-800 space-y-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-200"
          >
            {locale === 'uz' ? 'Imkoniyatlar' : locale === 'ru' ? 'Возможности' : 'Features'}
          </a>
          <a
            href="#qr-studio"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-200"
          >
            {t.qrStudio}
          </a>
          <a
            href="#bio-builder"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-200"
          >
            {t.bioPages}
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-200"
          >
            {t.pricing}
          </a>
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div className="flex gap-2">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className={`px-2.5 py-1 text-xs rounded-lg border ${
                    locale === l.code ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
            >
              {t.dashboard}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
