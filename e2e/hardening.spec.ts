import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { E2E_ENV } from './env';
import { loginAsTelegramUser } from './helpers';

const psql = (q: string) => execSync(`psql "${E2E_ENV.DATABASE_URL}" -Atc "${q}"`).toString().trim();

test('security headers on pages and APIs; nothing breaks under the content policy', async ({ page, request }) => {
  for (const url of ['/', '/dashboard', '/api/auth/me', '/b/apextech']) {
    const h = (await request.get(url)).headers();
    expect(h['content-security-policy'], url).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy'], url).toContain("object-src 'none'");
    expect(h['x-frame-options'], url).toBe('DENY');
    expect(h['x-content-type-options'], url).toBe('nosniff');
    expect(h['strict-transport-security'], url).toContain('max-age=');
    expect(h['referrer-policy'], url).toBe('strict-origin-when-cross-origin');
    expect(h['x-powered-by'], url).toBeUndefined();
  }

  // Pages load without content-policy violations (fonts, QR canvases, images, scripts)
  const violations: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
  await loginAsTelegramUser(page.request, 900000701, 'CSP Tester');
  for (const url of ['/', '/b/apextech', '/dashboard', '/dashboard/qr/new?type=vcard', '/dashboard/settings']) {
    await page.goto(url, { waitUntil: 'networkidle' });
  }
  expect(violations).toEqual([]);
});

test('URLs with user info ("site.com@evil") are refused everywhere', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000702, 'Phishing Tester');
  let res = await page.request.post('/api/links', { data: { destination_url: 'https://paypal.com@evil.example/login' } });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toContain('fishing');
  res = await page.request.post('/api/links', { data: { destination_url: 'https://example.com', ios_url: 'https://user:pass@evil.example' } });
  expect(res.status()).toBe(400);
  res = await page.request.post('/api/bio', { data: { handle: 'phishtest1', title: 'x', links: [{ title: 'Bank', url: 'https://bank.uz@evil.example' }] } });
  expect(res.status()).toBe(400);
});

test('every top-level route name is reserved, so no link can hide behind a page', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000703, 'Slug Tester');
  const names = fs
    .readdirSync(path.join(__dirname, '../src/app'))
    .map((f) => f.replace(/\.(tsx?|svg|css|ico)$/, ''))
    .filter((f) => /^[a-z0-9-]{3,}$/.test(f) && !['page', 'layout', 'globals'].includes(f));
  expect(names).toEqual(expect.arrayContaining(['apple-icon', 'opengraph-image', 'demo', 'dashboard']));
  for (const slug of names) {
    const res = await page.request.post('/api/links', { data: { destination_url: 'https://example.com', slug } });
    expect((await res.json()).code, slug).toBe('RESERVED_SLUG');
  }
});

test('slug check needs a login; link creation, API keys and bio clicks are rate limited', async ({ page, playwright }) => {
  const anon = await playwright.request.newContext({ baseURL: 'http://localhost:3100' });
  expect((await anon.get('/api/links/check-slug?slug=promo')).status()).toBe(401);
  await anon.dispose();

  await loginAsTelegramUser(page.request, 900000704, 'Limit Tester');
  expect((await page.request.get('/api/links/check-slug?slug=promo')).status()).toBe(200);

  // Pro plan so the 10-link free limit doesn't stop us first
  const ws = (await (await page.request.get('/api/auth/me')).json()).workspace.id;
  psql(`update workspaces set plan = 'pro' where id = '${ws}'`);
  const statuses: number[] = [];
  for (let i = 0; i < 31; i++) statuses.push((await page.request.post('/api/links', { data: { destination_url: `https://example.com/r${i}` } })).status());
  expect(statuses.slice(0, 30).every((s) => s === 201)).toBe(true);
  expect(statuses[30]).toBe(429);

  // API keys: 300 requests a minute per key
  const key = (await (await page.request.post('/api/api-keys', { data: { name: 'Limit' } })).json()).apiKey;
  const api = await playwright.request.newContext({ baseURL: 'http://localhost:3100', extraHTTPHeaders: { Authorization: `Bearer ${key}` } });
  let last = 0;
  for (let i = 0; i < 301; i++) last = (await api.get('/api/workspace/usage')).status();
  expect(last).toBe(429);
  await api.dispose();

  // Bio button clicks: one visitor adds at most 10 a minute
  const bio = await (await page.request.post('/api/bio', { data: { handle: 'limitbio1', title: 'L', links: [{ title: 'Tel', url: 'tel:+998901234567' }] } })).json();
  const buttonId = bio.bioPage.links[0].id;
  for (let i = 0; i < 12; i++) await page.request.post('/api/bio/click', { data: { linkId: buttonId } });
  expect(psql(`select click_count from bio_links where id = '${buttonId}'`)).toBe('10');

  // Counts live in Postgres, shared by every server process
  expect(Number(psql(`select count(*) from rate_limits`))).toBeGreaterThan(0);
});
