import { expect, test } from '@playwright/test';
import { loginAsTelegramUser } from './helpers';

test('landing page shows real statistics', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('TOTAL REDIRECTS')).toBeVisible();
  await expect(page.getByText('40,698,620')).toHaveCount(0);
});

test('visitors who are not logged in see the read-only demo', async ({ page }) => {
  await page.goto('/dashboard/links');
  await expect(page.getByText('ApexPay Mobil Ilova').first()).toBeVisible();
});

test('login → create link → redirect → click recorded', async ({ page, request }) => {
  // 1. Log in (the session cookie is shared with the browser page)
  await loginAsTelegramUser(page.request, 900000101, 'Smoke Tester');
  await page.goto('/dashboard/links');
  // A new user's workspace starts empty, without the demo links
  await expect(page.getByText('ApexPay Mobil Ilova')).toHaveCount(0);

  // 2. Create a link through the dashboard drawer
  const slug = `smoke-${Date.now().toString(36)}`;
  await page.keyboard.press('c');
  await page.getByPlaceholder('https://t.me/kanal, instagram.com/post yoki sayt.uz/promo').fill('example.com/smoke-test');
  await page.getByPlaceholder('promo-2026').fill(slug);
  await expect(page.getByText('Ushbu slug bo‘sh va foydalanishga tayyor')).toBeVisible();
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText(`/${slug}`).first()).toBeVisible();

  // 3. The short link redirects (a fresh context, like a real visitor)
  const visit = await request.get(`/${slug}`, {
    maxRedirects: 0,
    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
  });
  expect(visit.status()).toBe(307);
  expect(visit.headers()['location']).toBe('https://example.com/smoke-test');

  // 4. The click is recorded in the owner's analytics
  const list = await page.request.get('/api/links');
  const created = (await list.json()).links.find((l: { slug: string }) => l.slug === slug);
  expect(created.click_count).toBe(1);

  const analytics = await page.request.get(`/api/analytics?link_id=${created.id}`);
  const data = await analytics.json();
  expect(data.clicks).toHaveLength(1);
  expect(data.clicks[0].os).toBe('iOS');
});
