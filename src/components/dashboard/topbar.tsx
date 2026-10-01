'use client';

import React, { useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { Plus, Command, Menu } from 'lucide-react';
import { TelegramIcon } from '@/components/ui/icons';
import LanguageMenu from '@/components/ui/language-menu';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'urlsuzbot';

interface TopbarProps {
  onCreateLink: () => void;
  onToggleMobileSidebar?: () => void;
}

export default function Topbar({ onCreateLink, onToggleMobileSidebar }: TopbarProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Global keyboard shortcut: Cmd+K or Ctrl+K or hotkey 'C'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onCreateLink();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCreateLink]);


  return (
    <header className="h-12 bg-zinc-950 border-b border-zinc-800/80 px-4 md:px-6 flex items-center justify-between shrink-0">
      {/* Left: Mobile hamburger & Active Scope */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-900 border border-zinc-800"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-500">SCOPE:</span>
          <span className="text-zinc-200 font-medium">urls.uz</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Create Link Button (Solid High-Contrast Vercel/Linear style) */}
        <button
          onClick={onCreateLink}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 rounded-md border border-white/20 transition-all active:scale-[0.98] shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.createNewLink}</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-zinc-200 text-zinc-950 text-[10px] font-mono ml-1">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Telegram bot (free on every plan): send it a link, get a short link back */}
        <a
          href={`https://t.me/${BOT_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          title={`Telegram bot: @${BOT_USERNAME}`}
          aria-label={`Telegram bot @${BOT_USERNAME}`}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-[#229ED9] hover:bg-sky-500 text-white transition-colors"
        >
          <TelegramIcon className="w-3.5 h-3.5" />
        </a>

        {/* Language Switcher */}
        <LanguageMenu />
      </div>
    </header>
  );
}
