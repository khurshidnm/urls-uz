import { expect, test } from '@playwright/test';
import { E2E_ENV } from './env';
import { loginAsTelegramUser } from './helpers';

test('link page: settings, history and QR design', async ({ page, playwright }) => {
  await loginAsTelegramUser(page.request, 900000301, 'Detail Owner');
  const created = await page.request.post('/api/links', { data: { destination_url: 'https://example.com/detail', title: 'Detail link' } });
  const link = (await created.json()).link;

  await page.goto(`/dashboard/links/${link.id}`);
  await expect(page.getByRole('heading', { name: 'Detail link' })).toBeVisible();

  // Settings: rename and tag, then save
  await page.getByRole('tab', { name: 'Sozlamalar' }).click();
  const titleInput = page.locator('input[type="text"]').nth(2);
  await titleInput.fill('Renamed detail link');
  await page.getByPlaceholder('promo, telegram...').fill('launch');
  await page.getByPlaceholder('promo, telegram...').press('Enter');
  await expect(page.getByText('2 ta o‘zgarish saqlanmagan')).toBeVisible();
  await page.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.getByRole('heading', { name: 'Renamed detail link' })).toBeVisible();
  await expect(page.getByText('Barcha o‘zgarishlar saqlangan')).toBeVisible();

  // History shows who changed what
  await page.getByRole('tab', { name: 'Tarix' }).click();
  await expect(page.getByText('Tahrirlandi')).toBeVisible();
  await expect(page.getByText('Renamed detail link', { exact: false }).last()).toBeVisible();
  await expect(page.getByText('Havola yaratildi')).toBeVisible();

  // QR design is saved on the link
  await page.getByRole('tab', { name: 'QR kod' }).click();
  await page.locator('input[maxlength="40"]').fill('SKANERLANG');
  await page.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.getByText('QR dizayn saqlandi')).toBeVisible();
  const saved = await (await page.request.get(`/api/links/${link.id}`)).json();
  expect(saved.link.qr_config.frameText).toBe('SKANERLANG');

  // Deep link to a tab survives a reload
  await page.goto(`/dashboard/links/${link.id}?tab=history`);
  await expect(page.getByRole('tab', { name: 'Tarix' })).toHaveAttribute('aria-selected', 'true');

  // Other users can't open it
  const stranger = await playwright.request.newContext({ baseURL: E2E_ENV.NEXT_PUBLIC_APP_URL });
  await loginAsTelegramUser(stranger, 900000302, 'Stranger');
  expect((await stranger.get(`/dashboard/links/${link.id}`)).status()).toBe(404);
  await stranger.dispose();
});

test('editing a link applies the same plan limits and filters as creating one', async ({ playwright }) => {
  const ctx = await playwright.request.newContext({ baseURL: E2E_ENV.NEXT_PUBLIC_APP_URL });
  await loginAsTelegramUser(ctx, 900000303, 'Quota Editor');

  const first = (await (await ctx.post('/api/links', { data: { destination_url: 'https://t.me/one', open_in_app: true } })).json()).link;
  const second = (await (await ctx.post('/api/links', { data: { destination_url: 'https://t.me/two' } })).json()).link;
  expect(first.open_in_app).toBe(true);

  // Turning on a second deep link through PATCH is blocked, as on create
  let res = await ctx.patch(`/api/links/${second.id}`, { data: { open_in_app: true } });
  expect(res.status()).toBe(403);
  expect((await res.json()).code).toBe('DEEP_LINK_LIMIT_REACHED');

  // Editing the link that already has it is fine
  res = await ctx.patch(`/api/links/${first.id}`, { data: { title: 'Still a deep link', open_in_app: true } });
  expect(res.status()).toBe(200);

  // Device-specific URLs go through the phishing filter too
  res = await ctx.patch(`/api/links/${second.id}`, { data: { android_url: 'https://payme-security.example.com/app' } });
  expect(res.status()).toBe(400);
  expect((await res.json()).code).toBe('PHISHING_SUSPECTED');
  res = await ctx.post('/api/links', { data: { destination_url: 'https://example.com/ok', ios_url: 'https://click-uz.example.com/x' } });
  expect((await res.json()).code).toBe('PHISHING_SUSPECTED');

  // Unarchiving can't exceed the active-link limit: fill up to 10, archive one, add another, then unarchive
  const ids: string[] = [];
  for (let i = 0; i < 8; i++) {
    ids.push((await (await ctx.post('/api/links', { data: { destination_url: `https://example.com/fill-${i}` } })).json()).link.id);
  }
  await ctx.patch(`/api/links/${ids[0]}`, { data: { is_archived: true } });
  expect((await ctx.post('/api/links', { data: { destination_url: 'https://example.com/tenth' } })).status()).toBe(201);
  res = await ctx.patch(`/api/links/${ids[0]}`, { data: { is_archived: false } });
  expect(res.status()).toBe(403);
  expect((await res.json()).code).toBe('FREE_LIMIT_REACHED');

  const usage = await (await ctx.get('/api/workspace/usage')).json();
  expect(usage.usage).toEqual({ activeLinks: 10, deepLinks: 1, deviceTargeting: 0 });
  expect(usage.limits.activeLinks).toBe(10);
  await ctx.dispose();
});
