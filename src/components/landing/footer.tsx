'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { Link2, Terminal } from 'lucide-react';
import { SITE_NAME, BRAND_PARTS } from '@/lib/site';

export default function Footer() {
  const { locale, setLocale, t, tr } = useLanguage();

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 text-xs text-zinc-400 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & System Status */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100">
                <Link2 className="w-3 h-3 text-zinc-300" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">{BRAND_PARTS.name}<span className="text-zinc-500">{BRAND_PARTS.tld}</span></span>
            </Link>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              {tr('O‘zbekiston va xalqaro bozor uchun yuqori tezlikdagi URL yo‘naltirish va dinamik QR infratuzilmasi.', 'Быстрые короткие ссылки и динамические QR-коды для Узбекистана и всего мира.', 'Fast short links and dynamic QR codes for Uzbekistan and beyond.')}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{tr('Toshkent, O‘zbekiston', 'Ташкент, Узбекистан', 'Tashkent, Uzbekistan')}</span>
            </div>
          </div>

          {/* Product Specs */}
          <div>
            <h4 className="font-semibold text-zinc-200 mb-3 uppercase tracking-wider text-[10px]">{tr('Mahsulot', 'Продукт', 'Product')}</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Smart Deep Links</a></li>
              <li><a href="#qr-studio" className="hover:text-white transition-colors">{tr('Dinamik QR Studio', 'Динамическая QR-студия', 'Dynamic QR Studio')}</a></li>
              <li><a href="#bio-builder" className="hover:text-white transition-colors">{tr('Link-in-Bio Platformasi', 'Платформа Link-in-Bio', 'Link-in-Bio pages')}</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{tr('Tariflar', 'Тарифы', 'Pricing')}</a></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">{tr('Boshqaruv Paneli', 'Панель управления', 'Dashboard')}</Link></li>
            </ul>
          </div>

          {/* Developers & API */}
          <div>
            <h4 className="font-semibold text-zinc-200 mb-3 uppercase tracking-wider text-[10px]">{tr('Dasturchilar', 'Разработчикам', 'Developers')}</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard/api-keys" className="hover:text-white transition-colors">REST API Docs</Link></li>
              <li><Link href="/dashboard/api-keys" className="hover:text-white transition-colors">API Playground</Link></li>
              <li>
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'urlsuzbot'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Telegram bot
                </a>
              </li>
            </ul>
          </div>

          {/* Keyboard Shortcuts & Language */}
          <div>
            <h4 className="font-semibold text-zinc-200 mb-3 uppercase tracking-wider text-[10px]">{tr('Klaviatura & Til', 'Клавиатура и язык', 'Keyboard & language')}</h4>
            <div className="space-y-1.5 mb-4 text-[11px] text-zinc-500">
              <div className="flex items-center justify-between">
                <span>{tr('Havola qidirish:', 'Поиск ссылки:', 'Search links:')}</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{tr('Yangi havola yaratish:', 'Новая ссылка:', 'New link:')}</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">C</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{tr('Yopish / Bekor qilish:', 'Закрыть / Отмена:', 'Close / Cancel:')}</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">ESC</kbd>
              </div>
            </div>

            <div className="flex gap-1.5">
              {(['uz', 'ru', 'en'] as const).map((lCode) => (
                <button
                  key={lCode}
                  onClick={() => setLocale(lCode)}
                  className={`px-2 py-0.5 rounded border text-[11px] uppercase ${
                    locale === lCode
                      ? 'bg-zinc-800 text-white border-zinc-700'
                      : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {lCode}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar: System Telemetry & Copyright */}
        <div className="pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <div>
            © {new Date().getFullYear()} {SITE_NAME}. {tr('Barcha huquqlar himoyalangan.', 'Все права защищены.', 'All rights reserved.')}
          </div>
        </div>

      </div>
    </footer>
  );
}
