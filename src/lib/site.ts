/** Public site details shared by metadata, the sitemap, the manifest and structured data. */

/**
 * The site's address. Everything else (short links, bio pages, the brand
 * name, SEO, the bot, emails) follows it, so moving between domains (e.g. the
 * urlss.uz test site and urls.uz) is one environment change:
 * NEXT_PUBLIC_APP_URL, set at build time.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://urls.uz').replace(/\/$/, '');

/** Host as shown in short links: "urlss.uz", or "localhost:3001" in development. */
export const SITE_HOST = new URL(SITE_URL).host;

/** The brand: the domain name ("urls.uz" / "urlss.uz"); development keeps the real one. */
export const SITE_NAME = SITE_HOST.includes('.') && !/^\d/.test(SITE_HOST) ? SITE_HOST.replace(/^www\./, '') : 'urls.uz';

/** The logo text split at the dot ("urlss" + ".uz") for the two-tone wordmark. */
export const BRAND_PARTS = (() => {
  const dot = SITE_NAME.indexOf('.');
  return dot > 0 ? { name: SITE_NAME.slice(0, dot), tld: SITE_NAME.slice(dot) } : { name: SITE_NAME, tld: '' };
})();

/** Every domain the site has run on: links to them are never shortened again (redirect loops). */
export const OWN_HOSTS = [...new Set([SITE_HOST.replace(/^www\./, ''), 'urls.uz', 'urlss.uz'])];

export const SITE_TITLE = `${SITE_NAME} — havolalarni qisqartirish, QR kodlar va Link-in-Bio`;
export const SITE_DESCRIPTION =
  'O‘zbekiston uchun qisqa havolalar: qurilmaga qarab App Store, Google Play yoki AppGallery’ga yo‘naltirish, ' +
  'Telegram va Instagram ilovalarida ochiladigan havolalar, tahrirlanadigan QR kodlar, Link-in-Bio sahifa va viloyatlar bo‘yicha analitika.';

/** The link preview in Telegram, Facebook, X, ... (short: previews cut long text). */
export const SHARE_TITLE = 'Bitta havola — har bir qurilma o‘z yo‘lida';
export const SHARE_DESCRIPTION = 'Qisqa havolalar, QR kodlar va analitika';

export const SITE_KEYWORDS = [
  'havola qisqartirish',
  'qisqa havola',
  'url qisqartirish',
  'QR kod yaratish',
  'dinamik QR kod',
  'vCard QR kod',
  'link in bio',
  'Telegram deep link',
  'short link Uzbekistan',
  'URL shortener Uzbekistan',
  'сокращатель ссылок Узбекистан',
  'короткие ссылки',
  'QR код генератор',
  SITE_NAME,
];

/** Brand colors (the logo and dark theme). */
export const BRAND = { background: '#09090b', tile: '#27272a', tileBorder: '#3f3f46', mark: '#e4e4e7', accent: '#6366f1' };
