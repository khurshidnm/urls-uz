import React from 'react';
import Link from 'next/link';
import { Bot, ExternalLink } from 'lucide-react';

const COMMANDS: { command: string; text: string }[] = [
  { command: 'https://…', text: 'Istalgan havolani yuboring — bot uni qisqartirib, QR kod bilan qaytaradi' },
  { command: '/shorten <url> [nom]', text: 'O‘zingiz tanlagan nom bilan qisqartirish' },
  { command: '/stats <nom>', text: 'Havolaning bosishlari, viloyatlar va manbalar' },
  { command: '/qr <nom>', text: 'Havolaning QR kodi rasm shaklida' },
  { command: '/mylinks', text: 'So‘nggi havolalaringiz' },
];

/**
 * The urls.uz Telegram bot, for every plan. Links made there belong to the
 * account the Telegram user logs in with, so they show up in this dashboard.
 */
export default function TelegramBotCard({ botUsername }: { botUsername: string }) {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Telegram bot</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Havolalarni to‘g‘ridan-to‘g‘ri Telegram’dan qisqartiring. Barcha tariflarda bepul.</p>
          </div>
        </div>
        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#229ED9] hover:bg-sky-500 text-white text-xs font-semibold shrink-0"
        >
          @{botUsername} <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {COMMANDS.map((c) => (
          <li key={c.command} className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
            <code className="text-[11px] font-mono text-sky-300">{c.command}</code>
            <p className="text-[11px] text-zinc-400 mt-1">{c.text}</p>
          </li>
        ))}
        <li className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
          <code className="text-[11px] font-mono text-sky-300">@{botUsername} https://…</code>
          <p className="text-[11px] text-zinc-400 mt-1">Istalgan chatda yozing — havola joyida qisqartirilib yuboriladi</p>
        </li>
      </ul>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Bot orqali yaratilgan havolalar Telegram akkauntingiz ulangan urls.uz akkauntiga tushadi va tarif limitlariga kiradi. Telegram hali ulanmagan
        bo‘lsa,{' '}
        <Link href="/dashboard/settings#login-methods" className="text-indigo-400 hover:text-indigo-300">
          Sozlamalar → Kirish usullari
        </Link>{' '}
        bo‘limida ulang.
      </p>
    </div>
  );
}
