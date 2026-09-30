import { expect, test } from '@playwright/test';
import { E2E_ENV } from './env';
import { loginAsTelegramUser } from './helpers';

/** Sends an update to the bot webhook exactly as Telegram would. */
async function sendBotMessage(request: import('@playwright/test').APIRequestContext, fromId: number, text: string) {
  const res = await request.post('/api/webhook/telegram', {
    headers: { 'X-Telegram-Bot-Api-Secret-Token': E2E_ENV.TELEGRAM_WEBHOOK_SECRET },
    data: {
      update_id: Date.now(),
      message: { message_id: 1, chat: { id: fromId, type: 'private' }, from: { id: fromId, first_name: 'Bot User' }, text },
    },
  });
  expect(res.status()).toBe(200);
}

test('the Telegram bot creates links through the shared pipeline', async ({ request, playwright }) => {
  const botUserId = 900000201;
  await sendBotMessage(request, botUserId, 'https://example.com/from-bot');
  // Unsafe URLs are rejected by the same phishing filter as the dashboard
  await sendBotMessage(request, botUserId, 'https://payme-security.example.com/login');

  // Logging in with the same Telegram account shows the bot's link in the dashboard
  const browserless = await playwright.request.newContext({ baseURL: E2E_ENV.NEXT_PUBLIC_APP_URL });
  await loginAsTelegramUser(browserless, botUserId, 'Bot User');
  const links = (await (await browserless.get('/api/links')).json()).links as { destination_url: string; source: string }[];

  expect(links.map((l) => l.destination_url)).toEqual(['https://example.com/from-bot']);
  expect(links[0].source).toBe('telegram');
  await browserless.dispose();
});

test('webhook rejects updates without the secret token', async ({ request }) => {
  const res = await request.post('/api/webhook/telegram', {
    data: { update_id: 1, message: { chat: { id: 1 }, from: { id: 1 }, text: 'https://example.com' } },
  });
  expect(res.status()).toBe(403);
});

test('plan limits hold under concurrent requests', async ({ playwright }) => {
  const ctx = await playwright.request.newContext({ baseURL: E2E_ENV.NEXT_PUBLIC_APP_URL });
  await loginAsTelegramUser(ctx, 900000202, 'Racer');

  const results = await Promise.all(
    Array.from({ length: 15 }, (_, i) => ctx.post('/api/links', { data: { destination_url: `https://example.com/race-${i}` } }))
  );
  const statuses = results.map((r) => r.status());
  expect(statuses.filter((s) => s === 201)).toHaveLength(10);
  expect(statuses.filter((s) => s === 403)).toHaveLength(5);
  await ctx.dispose();
});

test('free plan: one deep link, one device-targeted link, no hidden click cap', async ({ playwright }) => {
  const ctx = await playwright.request.newContext({ baseURL: E2E_ENV.NEXT_PUBLIC_APP_URL });
  await loginAsTelegramUser(ctx, 900000203, 'Planner');

  const first = await ctx.post('/api/links', { data: { destination_url: 'https://t.me/durov', open_in_app: true } });
  expect(first.status()).toBe(201);
  const second = await ctx.post('/api/links', { data: { destination_url: 'https://t.me/telegram', open_in_app: true } });
  expect(second.status()).toBe(403);
  expect((await second.json()).code).toBe('DEEP_LINK_LIMIT_REACHED');

  const targeted = await ctx.post('/api/links', {
    data: { destination_url: 'https://example.com/app', ios_url: 'https://apps.apple.com/app/id1' },
  });
  expect(targeted.status()).toBe(201);
  // Device-targeted links used to be silently capped at 100 clicks
  expect((await targeted.json()).link.click_limit).toBeNull();

  const api = await ctx.post('/api/links', { data: { destination_url: 'https://example.com/x', source: 'landing' } });
  expect((await api.json()).link.source).toBe('landing');
  await ctx.dispose();
});
