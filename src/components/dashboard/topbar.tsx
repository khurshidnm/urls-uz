'use client';

import React, { useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { Plus, Globe, Command, Menu } from 'lucide-react';
import { Locale } from '@/lib/translations';

interface TopbarProps {
  onCreateLink: () => void;
  onToggleMobileSidebar?: () => void;
}

export default function Topbar({ onCreateLink, onToggleMobileSidebar }: TopbarProps) {
  const { locale, setLocale, t } = useLanguage();
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

  const locales: { code: Locale; label: string; flag: string }[] = [
    { code: 'uz', label: "O'zbekcha", flag: 'UZ' },
    { code: 'ru', label: 'Русский', flag: 'RU' },
    { code: 'en', label: 'English', flag: 'EN' },
  ];

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

        {/* Language Switcher */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/60 hover:bg-zinc-900 text-[11px] font-mono text-zinc-400 border border-zinc-800 transition-colors">
            <Globe className="w-3 h-3 text-zinc-500" />
            <span className="uppercase font-semibold">{locale}</span>
          </button>
          <div className="absolute right-0 mt-1 w-28 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-150 z-50">
            {locales.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1 text-xs text-left transition-colors font-mono ${
                  locale === l.code
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <span>{l.label}</span>
                <span className="text-[10px] text-zinc-500">{l.flag}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
