'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import LogoMark from '@/components/brand/logo-mark';
import { SITE_NAME, BRAND_PARTS } from '@/lib/site';
import { useLanguage } from '@/lib/language-context';

/**
 * Unknown short links, bio pages and paths. Most visitors arrive here from a
 * mistyped or old short link. Translated in the browser: reading the language
 * on the server would make every page dynamic, including the cached landing page.
 */
export default function NotFound() {
  const { locale, tr } = useLanguage();
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      {/* React hoists these into <head> (a client page can't export metadata) */}
      <title>{`${tr('Sahifa topilmadi', 'Страница не найдена', 'Page not found')} — ${SITE_NAME}`}</title>
      <meta name="robots" content="noindex" />
      <div className="max-w-md w-full text-center space-y-6">
        <Link href="/" className="inline-flex items-center gap-2" aria-label={`${SITE_NAME} — ${tr('bosh sahifa', 'главная', 'home')}`}>
          <LogoMark size={36} />
          <span className="font-semibold text-white font-mono">
            {BRAND_PARTS.name}<span className="text-zinc-500">{BRAND_PARTS.tld}</span>
          </span>
        </Link>

        <div>
          <p className="text-6xl font-black text-zinc-800 font-mono tracking-tight">404</p>
          <h1 className="mt-2 text-xl font-semibold text-white">{tr('Sahifa yoki havola topilmadi', 'Страница или ссылка не найдена', 'Page or link not found')}</h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            {tr('Havola noto‘g‘ri yozilgan, o‘chirilgan yoki hech qachon mavjud bo‘lmagan bo‘lishi mumkin. Havolani yuborgan odamdan tekshirishni so‘rang.', 'Ссылка могла быть набрана с ошибкой, удалена или никогда не существовала. Попросите отправителя проверить её.', 'The link may be mistyped, deleted, or may never have existed. Ask whoever sent it to check.')}
          </p>
          {/* Visitors from a short link often have no language set yet */}
          {locale === 'uz' && <p className="mt-3 text-xs text-zinc-500">Страница или ссылка не найдена · Page or link not found</p>}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {tr('Bosh sahifa', 'На главную', 'Home')}
          </Link>
          <Link
            href="/dashboard/links"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> {tr('O‘z havolangizni yarating', 'Создайте свою ссылку', 'Create your own link')}
          </Link>
        </div>
      </div>
    </main>
  );
}
