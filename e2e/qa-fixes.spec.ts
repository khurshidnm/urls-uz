import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { E2E_ENV } from './env';
import { loginAsTelegramUser } from './helpers';

const psql = (q: string) => execSync(`psql "${E2E_ENV.DATABASE_URL}" -Atc "${q}"`).toString().trim();
// Speed / uptime / infrastructure claims the product can't back up, and features that don't exist
const UNSUPPORTED = /\b\d+ ?(ms|мс)\b|\bSLA\b|Anycast|HTTP\/3|99[.,]9|A\/B test|v3\.\d|Operational|oylik qayta yo/;

test('landing and billing pages make no unsupported claims; planned features are labelled as planned', async ({ page }) => {
  await page.goto('/');
  const landing = await page.locator('body').innerText();
  expect(landing.match(UNSUPPORTED)).toBeNull();
  await expect(page.getByText(/Rejada \(hali mavjud emas\):.*Shaxsiy domen/)).toBeVisible();
  // The footer opens the Telegram bot, not the admin-only webhook section
  await expect(page.locator('footer a[href*="#telegram-webhook"]')).toHaveCount(0);
  await expect(page.locator('footer').getByRole('link', { name: 'Telegram bot' })).toHaveAttribute('href', /^https:\/\/t\.me\//);

  await loginAsTelegramUser(page.request, 900000811, 'Billing Reader');
  await page.goto('/dashboard/billing');
  expect((await page.locator('main').innerText()).match(UNSUPPORTED)).toBeNull();
});

test('settings profile shows the user’s own data and saves the name', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000812, 'Asl Ism');
  await page.goto('/dashboard/settings');
  const nameInput = page.getByLabel('Ism-familiya');
  await expect(nameInput).toHaveValue('Asl Ism');
  await expect(page.getByText('ApexTech')).toHaveCount(0);
  await expect(page.getByText(/Custom Domain|CNAME/)).toHaveCount(0);

  await nameInput.fill('Yangi Ism');
  await page.getByRole('button', { name: /Saqlash|Save/ }).click();
  await expect(page.getByText('Saqlandi!')).toBeVisible();
  // The sidebar follows, and it's stored
  await expect(page.locator('aside').getByText('Yangi Ism')).toBeVisible();
  expect((await (await page.request.get('/api/auth/me')).json()).user.name).toBe('Yangi Ism');
  expect((await page.request.patch('/api/account', { data: { name: '   ' } })).status()).toBe(400);
});

test('unknown pages and short links get a branded 404', async ({ page }) => {
  for (const path of ['/this-link-does-not-exist', '/b/nobody-here-123']) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Sahifa yoki havola topilmadi' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bosh sahifa/ })).toHaveAttribute('href', '/');
  }
});

test('bio page views count people, not crawlers, link previews or API reads', async ({ playwright }) => {
  const views = () => Number(psql(`select view_count from bio_pages where handle = 'apextech'`));
  const before = views();
  const visit = async (ua: string) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:3100', userAgent: ua });
    await ctx.get('/b/apextech');
    await ctx.dispose();
  };
  await visit('Googlebot/2.1 (+http://www.google.com/bot.html)');
  await visit('TelegramBot (like TwitterBot)');
  await visit('WhatsApp/2.23.20.0');
  expect(views()).toBe(before);

  const api = await playwright.request.newContext({ baseURL: 'http://localhost:3100' });
  await api.get('/api/bio/apextech');
  await api.dispose();
  expect(views()).toBe(before);

  await visit('Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');
  expect(views()).toBe(before + 1);
});
