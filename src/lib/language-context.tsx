'use client';

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Locale, translations } from './translations';
import { translateServerMessage } from './server-messages';

const STORAGE_KEY = 'urls_locale';
/** Same name as the storage key: server-rendered pages read the language from this cookie. */
export const LOCALE_COOKIE = 'urls_locale';
const DEFAULT_LOCALE: Locale = 'uz';
const listeners = new Set<() => void>();

const isLocale = (value: unknown): value is Locale => value === 'uz' || value === 'ru' || value === 'en';

/** The chosen language; for a first visit, the browser's language (the same rule the server uses). */
function readStoredLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {}
  const cookie = document.cookie.split('; ').find((c) => c.startsWith(`${LOCALE_COOKIE}=`))?.split('=')[1];
  if (isLocale(cookie)) return cookie;
  const browser = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  if (browser.startsWith('ru')) return 'ru';
  if (browser.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keep other tabs in sync too
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof translations.uz;
  /** Picks the text for the current language: tr('Saqlash', 'Сохранить', 'Save'). */
  tr: (uz: string, ru: string, en: string) => string;
  /** A message from the API (written in Uzbek) in the current language. */
  tm: (message: string | undefined | null) => string;
}

function writeCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // The server always renders the default locale; the browser then switches to the saved one
  const locale = useSyncExternalStore(subscribe, readStoredLocale, () => DEFAULT_LOCALE);

  const router = useRouter();

  const setLocale = (newLocale: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {}
    writeCookie(newLocale);
    listeners.forEach((notify) => notify());
    // Server-rendered parts (dashboard pages, bio pages, ...) re-render from the cookie
    router.refresh();
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // A language chosen before the cookie existed (saved only in this browser) is carried over to it.
  // Only an explicit choice is written: the first render uses the server's Uzbek default.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved) && !document.cookie.split('; ').includes(`${LOCALE_COOKIE}=${saved}`)) writeCookie(saved);
    } catch {}
  }, []);

  const t = translations[locale] || translations.uz;
  const tr = useCallback((uz: string, ru: string, en: string) => (locale === 'ru' ? ru : locale === 'en' ? en : uz), [locale]);
  const tm = useCallback((message: string | undefined | null) => (message ? translateServerMessage(message, locale) : ''), [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, tr, tm }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
