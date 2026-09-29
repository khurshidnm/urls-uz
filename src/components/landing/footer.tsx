'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { Link2, Heart } from 'lucide-react';

export default function Footer() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <footer className="border-t border-white/5 bg-[#070a12] py-14 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Link2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white">urls<span className="text-indigo-400">.uz</span></span>
            </Link>
            <p className="text-slate-400 leading-relaxed">
              {t.tagline}
            </p>
            <div className="flex items-center gap-1.5 text-slate-400 pt-2">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>in Tashkent, Uzbekistan</span>
            </div>
          </div>

          {/* Mahsulot (Product) */}
          <div>
            <h4 className="font-semibold text-white mb-3 tracking-wider uppercase text-[11px]">Mahsulot</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white transition-colors">Smart Deep Links</a></li>
              <li><a href="#qr-studio" className="hover:text-white transition-colors">Dinamik QR Studio</a></li>
              <li><a href="#bio-builder" className="hover:text-white transition-colors">Link-in-Bio</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Tariflar & Narxlar</a></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Boshqaruv paneli</Link></li>
            </ul>
          </div>

          {/* Dasturchilar (Developers) */}
          <div>
            <h4 className="font-semibold text-white mb-3 tracking-wider uppercase text-[11px]">Dasturchilar</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard/api-keys" className="hover:text-white transition-colors">REST API Hujjatlari</Link></li>
              <li><Link href="/dashboard/api-keys" className="hover:text-white transition-colors">API Playground</Link></li>
              <li><a href="https://github.com/khurshidnm/urls-uz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
              <li><span className="text-slate-500">Telegram Bot (Tez kunda)</span></li>
            </ul>
          </div>

          {/* Huquqiy & Til (Legal & Lang) */}
          <div>
            <h4 className="font-semibold text-white mb-3 tracking-wider uppercase text-[11px]">Til & Qoidalar</h4>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setLocale('uz')}
                className={`px-2.5 py-1 rounded-lg border text-xs ${
                  locale === 'uz' ? 'bg-indigo-600/30 text-indigo-400 border-indigo-500/50' : 'bg-slate-900 border-slate-800 hover:text-white'
                }`}
              >
                🇺🇿 UZ
              </button>
              <button
                onClick={() => setLocale('ru')}
                className={`px-2.5 py-1 rounded-lg border text-xs ${
                  locale === 'ru' ? 'bg-indigo-600/30 text-indigo-400 border-indigo-500/50' : 'bg-slate-900 border-slate-800 hover:text-white'
                }`}
              >
                🇷🇺 RU
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-2.5 py-1 rounded-lg border text-xs ${
                  locale === 'en' ? 'bg-indigo-600/30 text-indigo-400 border-indigo-500/50' : 'bg-slate-900 border-slate-800 hover:text-white'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} urls.uz. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
