'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import LanguageMenu from '@/components/ui/language-menu';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Menu, X, Link2, Terminal, Eye } from 'lucide-react';
import { Locale } from '@/lib/translations';
import { BRAND_PARTS } from '@/lib/site';

export default function Navbar() {
  const { locale, setLocale, t } = useLanguage();
  const { user, openAuthModal, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const locales: { code: Locale; label: string; flag: string }[] = [
    { code: 'uz', label: "O'zbekcha", flag: 'UZ' },
    { code: 'ru', label: 'Русский', flag: 'RU' },
    { code: 'en', label: 'English', flag: 'EN' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-150 ${
        scrolled
          ? 'bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80'
          : 'bg-zinc-950/60 backdrop-blur-sm border-b border-zinc-900/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-13 flex items-center justify-between">
        {/* Brand & System Status */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 group-hover:border-zinc-500 transition-colors">
              <Link2 className="w-3 h-3 text-zinc-300" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white font-mono">
              {BRAND_PARTS.name}<span className="text-zinc-500">{BRAND_PARTS.tld}</span>
            </span>
          </Link>

        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs text-zinc-400 font-medium">
          <a href="#features" className="hover:text-zinc-100 transition-colors">
            {locale === 'uz' ? 'Imkoniyatlar' : locale === 'ru' ? 'Возможности' : 'Features'}
          </a>
          <a href="#qr-studio" className="hover:text-zinc-100 transition-colors">
            {t.qrStudio}
          </a>
          <a href="#bio-builder" className="hover:text-zinc-100 transition-colors">
            {t.bioPages}
          </a>
          <a href="#pricing" className="hover:text-zinc-100 transition-colors">
            {t.pricing}
          </a>
          <Link href="/dashboard/api-keys" className="hover:text-zinc-100 transition-colors flex items-center gap-1 font-mono">
            <Terminal className="w-3 h-3 text-zinc-500" />
            <span>API</span>
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageMenu prefix="LOCALE:" />

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md border border-white/20 transition-all active:scale-[0.98]"
              >
                <span>{t.dashboard}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={logout}
                title="Chiqish"
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/dashboard?demo=true"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 rounded-md border border-amber-500/30 transition-all"
              >
                <Eye className="w-3 h-3 text-amber-400" />
                <span>{locale === 'uz' ? 'Demo ko‘rish' : locale === 'ru' ? 'Демо' : 'Live Demo'}</span>
              </Link>
              <button
                onClick={() => openAuthModal()}
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/60 hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors"
              >
                {locale === 'uz' ? 'Kirish' : locale === 'ru' ? 'Войти' : 'Sign in'}
              </button>
              <button
                onClick={() => openAuthModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md border border-white/20 transition-all active:scale-[0.98]"
              >
                <span>{locale === 'uz' ? 'Boshlash' : locale === 'ru' ? 'Начать' : 'Get Started'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {!user && (
            <Link
              href="/dashboard?demo=true"
              className="px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-md"
            >
              Demo
            </Link>
          )}
          {!user && (
            <button
              onClick={() => openAuthModal()}
              className="px-2.5 py-1 text-xs font-medium text-zinc-950 bg-white rounded-md"
            >
              Kirish
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 rounded-md border border-zinc-800"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-b border-zinc-800 bg-zinc-950/95 space-y-2">
          <nav className="flex flex-col gap-2 text-xs font-medium text-zinc-300">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1">
              Imkoniyatlar
            </a>
            <a href="#qr-studio" onClick={() => setMobileMenuOpen(false)} className="py-1">
              QR Studio
            </a>
            <a href="#bio-builder" onClick={() => setMobileMenuOpen(false)} className="py-1">
              Bio Pages
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1">
              Tariflar
            </a>
            <Link href="/dashboard/api-keys" onClick={() => setMobileMenuOpen(false)} className="py-1 font-mono">
              API
            </Link>
          </nav>
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <div className="flex gap-1">
              {locales.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    locale === l.code
                      ? 'bg-zinc-800 text-white border-zinc-700'
                      : 'text-zinc-500 border-zinc-900'
                  }`}
                >
                  {l.flag}
                </button>
              ))}
            </div>
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-1 bg-white text-zinc-950 rounded text-xs font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal();
                }}
                className="px-3 py-1 bg-white text-zinc-950 rounded text-xs font-medium"
              >
                Kirish
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
