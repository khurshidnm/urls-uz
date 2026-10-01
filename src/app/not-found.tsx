import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import LogoMark from '@/components/brand/logo-mark';

export const metadata: Metadata = { title: 'Sahifa topilmadi', robots: { index: false } };

/** Unknown short links, bio pages and paths. Most visitors arrive here from a mistyped or old short link. */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="urls.uz bosh sahifa">
          <LogoMark size={36} />
          <span className="font-semibold text-white font-mono">
            urls<span className="text-zinc-500">.uz</span>
          </span>
        </Link>

        <div>
          <p className="text-6xl font-black text-zinc-800 font-mono tracking-tight">404</p>
          <h1 className="mt-2 text-xl font-semibold text-white">Sahifa yoki havola topilmadi</h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            Havola noto‘g‘ri yozilgan, o‘chirilgan yoki hech qachon mavjud bo‘lmagan bo‘lishi mumkin. Havolani yuborgan odamdan tekshirishni so‘rang.
          </p>
          <p className="mt-3 text-xs text-zinc-500">Страница или ссылка не найдена · Page or link not found</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Bosh sahifa
          </Link>
          <Link
            href="/dashboard/links"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> O‘z havolangizni yarating
          </Link>
        </div>
      </div>
    </main>
  );
}
