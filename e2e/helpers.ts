import crypto from 'crypto';
import type { APIRequestContext } from '@playwright/test';
import { E2E_ENV } from './env';

/** Signs Telegram Login Widget data exactly like Telegram does. */
export function signTelegram(data: Record<string, string>): Record<string, string> {
  const secret = crypto.createHash('sha256').update(E2E_ENV.TELEGRAM_BOT_TOKEN).digest();
  const checkString = Object.keys(data).sort().map((k) => `${k}=${data[k]}`).join('\n');
  return { ...data, hash: crypto.createHmac('sha256', secret).update(checkString).digest('hex') };
}

export function telegramWidgetData(id: number, name: string) {
  return signTelegram({ id: String(id), first_name: name, auth_date: String(Math.floor(Date.now() / 1000)) });
}

/** Logs in through the real Telegram endpoint; the session cookie lands in the request context. */
export async function loginAsTelegramUser(request: APIRequestContext, id: number, name: string) {
  const res = await request.post('/api/auth/telegram', {
    data: { action: 'verify-widget', widgetData: telegramWidgetData(id, name) },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  return (await res.json()).user as { id: string; name: string };
}
