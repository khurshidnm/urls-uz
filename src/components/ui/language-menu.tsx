'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import type { Locale } from '@/lib/translations';

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'uz', label: 'O‘zbekcha' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

/**
 * Language picker. Opens on click (hover menus close while the pointer
 * crosses the gap to the list, and don't exist on touch screens); closes on
 * choosing, Escape, or a click outside.
 */
export default function LanguageMenu({ prefix }: { prefix?: string }) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Til / Язык / Language"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono border transition-colors ${
          open ? 'bg-zinc-900 text-zinc-200 border-zinc-700' : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 border-zinc-800'
        }`}
      >
        {prefix ? <span className="text-zinc-500">{prefix}</span> : <Globe className="w-3 h-3 text-zinc-500" />}
        <span className="uppercase font-semibold text-zinc-200">{locale}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 w-32 py-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 animate-fade-in">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={locale === l.code}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-left transition-colors ${
                locale === l.code ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <span>{l.label}</span>
              {locale === l.code ? <Check className="w-3 h-3 text-indigo-400" /> : <span className="text-[10px] font-mono text-zinc-600 uppercase">{l.code}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
