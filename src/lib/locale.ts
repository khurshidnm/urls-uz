import { cookies, headers } from 'next/headers';
import type { Locale } from '@/lib/translations';

export type Tr = (uz: string, ru: string, en: string) => string;

/**
 * The visitor's language on the server: the language menu's cookie, or for
 * first-time visitors (someone opening a short link) the browser's language.
 * Uzbek by default.
 */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get('urls_locale')?.value;
  if (value === 'uz' || value === 'ru' || value === 'en') return value;
  const preferred = ((await headers()).get('accept-language') ?? '').toLowerCase().split(',')[0].trim();
  if (preferred.startsWith('ru')) return 'ru';
  if (preferred.startsWith('en')) return 'en';
  return 'uz';
}

/** A text picker for server components: const tr = await getTr(); tr('Saqlash', 'Сохранить', 'Save'). */
export async function getTr(): Promise<Tr> {
  const locale = await getLocale();
  return (uz, ru, en) => (locale === 'ru' ? ru : locale === 'en' ? en : uz);
}
