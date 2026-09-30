import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { E2E_ENV } from './env';
import { loginAsTelegramUser } from './helpers';

const psql = (query: string) => execSync(`psql "${E2E_ENV.DATABASE_URL}" -Atc "${query}"`).toString().trim();

const DEVICES = [
  'Mozilla/5.0 (Linux; Android 14)',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0',
];

test('a burst of clicks is batched: every click counted, analytics from daily totals', async ({ page, playwright }) => {
  await loginAsTelegramUser(page.request, 900000801, 'Viral Owner');
  const link = (await (await page.request.post('/api/links', { data: { destination_url: 'https://example.com/viral' } })).json()).link;

  // 60 visitors at once; redirects don't wait for the database
  const visitor = await playwright.request.newContext({ baseURL: 'http://localhost:3100' });
  const visits = await Promise.all(
    Array.from({ length: 60 }, (_, i) =>
      visitor.get(`/${link.slug}`, { maxRedirects: 0, headers: { 'User-Agent': DEVICES[i % DEVICES.length], Referer: i % 2 ? 'https://t.me/x' : '' } })
    )
  );
  expect(visits.every((v) => v.status() === 307)).toBe(true);
  await visitor.dispose();

  const analytics = async () => (await page.request.get(`/api/analytics?link_id=${link.id}`)).json();
  await expect.poll(async () => (await analytics()).link.click_count).toBe(60);

  const data = await analytics();
  expect(data.totalClicks).toBe(60);
  expect(data.timeline.at(-1).count).toBe(60);
  const byOs = Object.fromEntries(data.os.map((o: { os: string; count: number }) => [o.os, o.count]));
  expect(byOs).toEqual({ Android: 20, iOS: 20, Windows: 20 });
  const telegram = data.referrers.find((r: { referer: string }) => r.referer === 'Telegram');
  expect(telegram.count).toBe(30);
  // The visit log still shows raw clicks
  expect(data.clicks).toHaveLength(60);

  // The workspace overview adds up the same totals
  const overview = await (await page.request.get('/api/analytics')).json();
  expect(overview.totalClicks).toBe(60);
});

test('raw clicks past the retention period are pruned; totals stay', async ({ page, request }) => {
  await loginAsTelegramUser(page.request, 900000802, 'Retention Owner');
  const link = (await (await page.request.post('/api/links', { data: { destination_url: 'https://example.com/old' } })).json()).link;
  await request.get(`/${link.slug}`, { maxRedirects: 0, headers: { 'User-Agent': DEVICES[0] } });
  await expect.poll(async () => (await (await page.request.get(`/api/links/${link.id}`)).json()).link.click_count).toBe(1);

  // Age that click beyond the free plan's 30 days (its daily total stays where it was)
  psql(`update clicks set created_at = now() - interval '45 days' where link_id = '${link.id}'`);

  expect((await request.get('/api/cron/prune-clicks')).status()).toBe(401);
  expect((await request.get('/api/cron/prune-clicks', { headers: { Authorization: 'Bearer wrong' } })).status()).toBe(401);
  const res = await request.get('/api/cron/prune-clicks', { headers: { Authorization: `Bearer ${E2E_ENV.CRON_SECRET}` } });
  expect(res.status()).toBe(200);
  expect((await res.json()).deleted.free).toBeGreaterThanOrEqual(1);

  expect(psql(`select count(*) from clicks where link_id = '${link.id}'`)).toBe('0');
  const data = await (await page.request.get(`/api/analytics?link_id=${link.id}&range=all`)).json();
  expect(data.link.click_count).toBe(1);
  expect(data.totalClicks).toBe(1);
  expect(data.os).toEqual([{ os: 'Android', count: 1 }]);
  // The demo workspace is never pruned
  expect(Number(psql(`select count(*) from clicks c join links l on l.id = c.link_id where l.workspace_id = 'ws_demo'`))).toBe(1500);
});
