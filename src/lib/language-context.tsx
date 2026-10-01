'use client';

import React, { createContext, useContext, useSyncExternalStore } from 'react';
import { Locale, translations } from './translations';

const STORAGE_KEY = 'urls_locale';
const DEFAULT_LOCALE: Locale = 'uz';
const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'uz' || saved === 'ru' || saved === 'en' ? saved : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
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
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // The server always renders the default locale; the browser then switches to the saved one
  const locale = useSyncExternalStore(subscribe, readStoredLocale, () => DEFAULT_LOCALE);

  const setLocale = (newLocale: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {}
    listeners.forEach((notify) => notify());
  };

  const t = translations[locale] || translations.uz;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
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
