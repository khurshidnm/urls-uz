import crypto from 'crypto';
import type { UserRecord } from '@/lib/db';
import { signIn, type LoginProfile } from '@/lib/accounts';

const MAX_AUTH_AGE_SECONDS = 60 * 60 * 24;

/**
 * Verifies data from the official Telegram Login Widget.
 * https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLogin(authData: Record<string, string>): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const { hash, ...data } = authData;
  if (!botToken || !hash || !data.id || !data.auth_date) return false;

  if (Date.now() / 1000 - Number(data.auth_date) > MAX_AUTH_AGE_SECONDS) return false;

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n');
  const expected = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  return expected.length === hash.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
}

/** Keeps only the fields Telegram signs, as strings, so the hash check sees exactly what Telegram sent. */
export function pickTelegramFields(source: Record<string, unknown>): Record<string, string> {
  const fields = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash'];
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = source[f];
    if (v !== undefined && v !== null && v !== '') out[f] = String(v);
  }
  return out;
}

/** A verified Telegram login (widget, or a message to the bot) as a login method. */
export function telegramProfile(data: Record<string, string>): LoginProfile {
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
  const name = fullName || (data.username ? `@${data.username}` : 'Telegram foydalanuvchisi');
  return {
    provider: 'telegram',
    providerId: data.id,
    name,
    label: data.username ? `${fullName || name} (@${data.username})` : name,
    avatarUrl: data.photo_url,
  };
}

/** The account for a Telegram user, created on first use. */
export async function upsertTelegramUser(data: Record<string, string>): Promise<UserRecord> {
  const result = await signIn(telegramProfile(data));
  if (!result.ok) throw new Error(result.error);
  return result.user;
}
