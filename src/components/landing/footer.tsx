'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { Link2, Radio, Terminal } from 'lucide-react';

export default function Footer() {
  const { locale, setLocale, t } = useLanguage();

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
              <span className="font-semibold text-sm tracking-tight text-white">urls<span className="text-zinc-500">.uz</span></span>
            </Link>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              O‘zbekiston va xalqaro bozor uchun yuqori tezlikdagi URL yo‘naltirish va dinamik QR infratuzilmasi.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Toshkent, O‘zbekiston</span>
            </div>
          </div>

          {/* Product Specs */}
          <div>
            <h4 className="font-semibold text-zinc-200 mb-3 uppercase tracking-wider text-[10px]">Mahsulot</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Smart Deep Links</a></li>
              <li><a href="#qr-studio" className="hover:text-white transition-colors">Dinamik QR Studio</a></li>
              <li><a href="#bio-builder" className="hover:text-white transition-colors">Link-in-Bio Platformasi</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Tariflar & SLA</a></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Boshqaruv Paneli</Link></li>
            </ul>
          </div>

          {/* Developers & API */}
          <div>
            <h4 className="font-semibold text-zinc-200 mb-3 uppercase tracking-wider text-[10px]">Dasturchilar</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard/api-keys" className="hover:text-white transition-colors">REST API Docs</Link></li>
              <li><Link href="/dashboard/api-keys" className="hover:text-white transition-colors">API Playground</Link></li>
              <li><a href="https://github.com/khurshidnm/urls-uz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repository</a></li>
              <li><span className="text-zinc-600">Telegram Bot Webhook (v3)</span></li>
            </ul>
          </div>

          {/* Keyboard Shortcuts & Language */}
          <div>
            <h4 className="font-semibold text-zinc-200 mb-3 uppercase tracking-wider text-[10px]">Klaviatura & Til</h4>
            <div className="space-y-1.5 mb-4 text-[11px] text-zinc-500">
              <div className="flex items-center justify-between">
                <span>Havola qidirish:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Yangi havola yaratish:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">C</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Yopish / Bekor qilish:</span>
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
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Operational · Sub-15ms Anycast Edge · v3.4.1</span>
          </div>
          <div>
            © {new Date().getFullYear()} urls.uz. Barcha huquqlar himoyalangan.
          </div>
        </div>

      </div>
    </footer>
  );
}
