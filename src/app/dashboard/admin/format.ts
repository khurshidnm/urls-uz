import { formatNumber } from '@/lib/utils';

/** "3 soat oldin" — how long ago, for activity columns (rendered on the server). */
export function timeAgo(value: Date | string | null): string {
  if (!value) return '—';
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'hozirgina';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} daqiqa oldin`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} soat oldin`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)} kun oldin`;
  if (seconds < 86400 * 365) return `${Math.floor(seconds / (86400 * 30))} oy oldin`;
  return `${Math.floor(seconds / (86400 * 365))} yil oldin`;
}

export const som = (amount: number) => `${formatNumber(amount)} so‘m`;

export const PLAN_LABELS: Record<string, string> = { free: 'Bepul', pro: 'Pro', enterprise: 'Biznes' };
export const PROVIDER_LABELS: Record<string, string> = { google: 'Google', telegram: 'Telegram', phone: 'Telefon', password: 'Login', email: 'Email' };
export const METHOD_LABELS: Record<string, string> = { manual: 'Qo‘lda', payme: 'Payme', click: 'Click', uzum: 'Uzum' };
