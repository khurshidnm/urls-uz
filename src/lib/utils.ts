import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Public short URL for a slug (what QR codes encode and users share). */
export function shortUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'https://urls.uz'}/${slug}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RESERVED_SLUGS = new Set([
  'api', 'dashboard', 'b', 'bio', 'login', 'register', 'auth', 'settings',
  'analytics', 'links', 'qr', 'billing', 'api-keys', 'admin', 'terms',
  'privacy', 'status', 'health', '404', '500', 'favicon.ico', 'robots.txt',
  'sitemap.xml', '_next', 'manifest.json', 'assets', 'static', 'webhook',
  'callback', 'public', 'pricing', 'features', 'docs', 'about', 'contact',
  'signin', 'signup', 'logout', 'help', 'app', 'system'
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has((slug || '').toLowerCase().trim());
}

export function isValidSlug(slug: string): boolean {
  const clean = (slug || '').trim();
  if (clean.length < 3 || clean.length > 50) return false;
  if (!/^[a-zA-Z0-9_-]+$/.test(clean)) return false;
  if (isReservedSlug(clean)) return false;
  return true;
}

export function generateRandomSlug(length = 5): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Universal Clipboard utility with legacy fallback for non-secure / webview contexts
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Modern Async Clipboard API (Secure Context)
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }

  // Legacy textarea + execCommand fallback for HTTP/iframe/legacy environments
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Safely appends UTM parameters preserving existing query string parameters
 */
export function appendUtmParams(
  url: string,
  utm: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  }
): string {
  if (!url) return url;
  const hasParams = Boolean(utm.source || utm.medium || utm.campaign || utm.term || utm.content);
  if (!hasParams) return url;

  try {
    const hasScheme = /^https?:\/\//i.test(url);
    const parsed = new URL(hasScheme ? url : `https://${url}`);

    if (utm.source?.trim()) parsed.searchParams.set('utm_source', utm.source.trim());
    if (utm.medium?.trim()) parsed.searchParams.set('utm_medium', utm.medium.trim());
    if (utm.campaign?.trim()) parsed.searchParams.set('utm_campaign', utm.campaign.trim());
    if (utm.term?.trim()) parsed.searchParams.set('utm_term', utm.term.trim());
    if (utm.content?.trim()) parsed.searchParams.set('utm_content', utm.content.trim());

    return hasScheme ? parsed.toString() : parsed.toString().replace(/^https?:\/\//i, '');
  } catch {
    // Fallback: Safe query parameter concatenation
    const params = new URLSearchParams();
    if (utm.source?.trim()) params.set('utm_source', utm.source.trim());
    if (utm.medium?.trim()) params.set('utm_medium', utm.medium.trim());
    if (utm.campaign?.trim()) params.set('utm_campaign', utm.campaign.trim());
    if (utm.term?.trim()) params.set('utm_term', utm.term.trim());
    if (utm.content?.trim()) params.set('utm_content', utm.content.trim());

    const qs = params.toString();
    if (!qs) return url;
    return url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
  }
}

export function formatNumber(num: number): string {
  // Fixed locale so server-rendered and hydrated output match
  return new Intl.NumberFormat('en-US').format(num);
}

/** Date and time in Uzbekistan time; fixed locale and zone so server and client render the same text. */
export function formatDateTime(value: string | Date): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tashkent',
  }).format(d);
}

const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const SHORT_MONTHS = {
  uz: UZ_MONTHS,
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** "30-sen" / "30 сен" / "30 Sep" — short day label for charts (same output on server and client). */
export function formatDay(value: string | Date, locale: keyof typeof SHORT_MONTHS = 'uz'): string {
  // Plain "YYYY-MM-DD" days are formatted as-is, so no time zone can shift them
  const plain = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = plain ? null : new Date(value);
  if (d && Number.isNaN(d.getTime())) return String(value);
  const day = plain ? Number(plain[3]) : d!.getDate();
  const month = SHORT_MONTHS[locale][plain ? Number(plain[2]) - 1 : d!.getMonth()];
  return locale === 'uz' ? `${day}-${month}` : `${day} ${month}`;
}

/** "30-sen, 2026" — browsers render the uz-UZ locale inconsistently ("2026 M09 30"), so format by hand. */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}
