'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { Layers, CheckCircle2, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import { TelegramIcon, InstagramIcon, YouTubeIcon } from '@/components/ui/icons';

export default function BioPreviewSection() {
  const { locale, t } = useLanguage();

  return (
    <section id="bio-builder" className="py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Mockup Phone Container */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <div className="relative w-[300px] sm:w-[320px] rounded-[44px] p-3.5 bg-slate-800 border-[3px] border-slate-700/80 shadow-2xl shadow-indigo-500/10">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20" />

              {/* Phone Screen */}
              <div className="w-full bg-[#090d16] rounded-[36px] overflow-hidden p-5 pt-10 text-center border border-white/5">
                {/* Avatar */}
                <div className="relative mx-auto w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 mb-3 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160"
                    alt="Bio Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>

                {/* Name & Badge */}
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h4 className="font-bold text-white text-base">Khurshid Nurmukhamedov</h4>
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xs text-indigo-400 font-medium mb-2">@khurshid · urls.uz/b/khurshid</p>
                <p className="text-[11px] text-slate-400 mb-4 px-2 leading-tight">
                  Tadbirkor & Veb Dasturchi. Toshkent shahrida startaplar va raqamli marketing loyihalari 🚀
                </p>

                {/* Social icons */}
                <div className="flex justify-center gap-2 mb-4">
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#229ED9]">
                    <TelegramIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#E1306C]">
                    <InstagramIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#FF0000]">
                    <YouTubeIcon className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* Links */}
                <div className="space-y-2 mb-4 text-xs font-semibold">
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md">
                    <span>🔥 Yangi Kurs & Loyihalarim</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-between">
                    <span>📱 Telegram Kanalga Qo‘shilish</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 flex items-center justify-between">
                    <span>💼 Portfolio & Aloqa</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </div>

                {/* Footnote */}
                <div className="text-[10px] text-slate-500">urls.uz bio sahifasi</div>
              </div>
            </div>
          </div>

          {/* Right Description & Action */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.bioPages}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              {locale === 'uz'
                ? 'Barcha ijtimoiy tarmoqlaringiz uchun bitta mukammal sahifa'
                : locale === 'ru'
                ? 'Единая страница для всех ваших соцсетей и ссылок'
                : 'One Beautiful Page for All Your Social Links'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6">
              {locale === 'uz'
                ? 'Instagram yoki TikTok profilida faqat bitta havola qo‘yish mumkin. urls.uz/b/@nomingiz orqali auditoriyangizga barcha kanallaringiz, saytlaringiz, xizmatlaringiz va kontaktlaringizni chiroyli ko‘rsating.'
                : locale === 'ru'
                ? 'Лимит на одну ссылку в био Instagram больше не проблема. Создайте urls.uz/b/@имя и объедините все важные ссылки с удобной аналитикой.'
                : 'Instagram limits you to one bio link. Turn that link into an interactive portal with your branding, products, and channels.'}
            </p>

            <div className="space-y-3 mb-8 text-sm text-slate-300">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">✓</div>
                <span>Shaxsiy <code className="text-indigo-400 bg-slate-900 px-2 py-0.5 rounded">urls.uz/b/@username</code> havolasi</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">✓</div>
                <span>Har bir tugma bo‘yicha alohida bosishlar statistikasi</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">✓</div>
                <span>6 xil dizayn mavzulari (Midnight, Neon, Emerald, Glass va boshqalar)</span>
              </div>
            </div>

            <Link
              href="/dashboard/bio"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-btn text-white text-sm font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <span>{t.createBioPage}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
