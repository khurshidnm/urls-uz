/** Public site details shared by metadata, the sitemap, the manifest and structured data. */

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://urls.uz').replace(/\/$/, '');
export const SITE_NAME = 'urls.uz';

export const SITE_TITLE = 'urls.uz — havolalarni qisqartirish, QR kodlar va Link-in-Bio';
export const SITE_DESCRIPTION =
  'O‘zbekiston uchun qisqa havolalar: qurilmaga qarab App Store, Google Play yoki AppGallery’ga yo‘naltirish, ' +
  'Telegram va Instagram ilovalarida ochiladigan havolalar, tahrirlanadigan QR kodlar, Link-in-Bio sahifa va viloyatlar bo‘yicha analitika.';

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
  'urls.uz',
];

/** Brand colors (the logo and dark theme). */
export const BRAND = { background: '#09090b', tile: '#27272a', tileBorder: '#3f3f46', mark: '#e4e4e7', accent: '#6366f1' };
