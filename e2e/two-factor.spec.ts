import { expect, test } from '@playwright/test';
import { codeAt, currentStep } from '../src/lib/two-factor/totp';
import { loginAsTelegramUser, telegramWidgetData } from './helpers';

const BASE = 'http://localhost:3100';

test('two-step login with an authenticator app: enable, log in, recovery codes, disable', async ({ page, playwright }) => {
  await loginAsTelegramUser(page.request, 900000951, 'Himoyalangan Foydalanuvchi');
  await page.goto('/dashboard/settings#two-factor');
  const section = page.locator('#two-factor');
  await expect(section.getByText('O‘chiq.')).toBeVisible();

  // Setup: QR code and the key for manual entry
  await section.getByRole('button', { name: '2FA ni yoqish' }).click();
  await expect(section.locator('canvas')).toBeVisible();
  const secret = (await section.getByRole('button', { name: /^[A-Z2-7 ]{20,}$/ }).innerText()).replace(/\s/g, '');
  expect(secret).toMatch(/^[A-Z2-7]{32}$/);

  // A wrong code is refused; the app's current code switches 2FA on
  await section.getByLabel('Tasdiqlash kodi').fill('000000');
  await section.getByRole('button', { name: 'Tasdiqlash va yoqish' }).click();
  await expect(page.getByText(/Kod noto‘g‘ri/)).toBeVisible();
  const setupStep = currentStep();
  await section.getByLabel('Tasdiqlash kodi').fill(codeAt(secret, setupStep));
  await section.getByRole('button', { name: 'Tasdiqlash va yoqish' }).click();
  const codes = section.getByRole('list', { name: 'Tiklash kodlari' }).getByRole('listitem');
  await expect(codes).toHaveCount(10);
  const recovery = await codes.allInnerTexts();
  await section.getByRole('button', { name: 'Saqladim' }).click();
  await expect(section.getByText(/Yoqilgan .* 10 ta tiklash kodi qoldi/)).toBeVisible();

  // Logging in again stops at the code page: no session yet
  const fresh = await playwright.request.newContext({ baseURL: BASE });
  const first = await fresh.post('/api/auth/telegram', {
    data: { action: 'verify-widget', widgetData: telegramWidgetData(900000951, 'Himoyalangan Foydalanuvchi') },
  });
  const firstBody = await first.json();
  expect(firstBody).toMatchObject({ success: true, twoFactorRequired: true, redirect: '/login/2fa' });
  expect(firstBody.user).toBeUndefined();
  expect((await (await fresh.get('/api/auth/me')).json()).user).toBeNull();

  // A code already used (at setup) is refused; the next one works and starts the session
  let res = await fresh.post('/api/auth/2fa/verify', { data: { code: codeAt(secret, setupStep) } });
  expect(res.status()).toBe(401);
  res = await fresh.post('/api/auth/2fa/verify', { data: { code: codeAt(secret, setupStep + 1) } });
  expect(res.status()).toBe(200);
  expect((await (await fresh.get('/api/auth/me')).json()).user.name).toBe('Himoyalangan Foydalanuvchi');
  await fresh.dispose();

  // The code page in the browser, with a recovery code (each works once)
  const browserLogin = await playwright.request.newContext({ baseURL: BASE });
  await page.context().clearCookies();
  await page.request.post('/api/auth/telegram', {
    data: { action: 'verify-widget', widgetData: telegramWidgetData(900000951, 'Himoyalangan Foydalanuvchi') },
  });
  await page.goto('/login/2fa');
  await page.getByRole('button', { name: /tiklash kodi/ }).click();
  await page.getByLabel('Tiklash kodi').fill(recovery[0]);
  await page.getByRole('button', { name: 'Tasdiqlash va kirish' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await browserLogin.dispose();

  const again = await playwright.request.newContext({ baseURL: BASE });
  await again.post('/api/auth/telegram', { data: { action: 'verify-widget', widgetData: telegramWidgetData(900000951, 'Himoyalangan Foydalanuvchi') } });
  expect((await again.post('/api/auth/2fa/verify', { data: { code: recovery[0] } })).status()).toBe(401);
  await again.dispose();

  // The redirect login (Telegram widget) goes to the code page too
  const widget = await playwright.request.newContext({ baseURL: BASE });
  const params = new URLSearchParams(telegramWidgetData(900000951, 'Himoyalangan Foydalanuvchi'));
  const redirect = await widget.get(`/api/auth/telegram/callback?${params}`, { maxRedirects: 0 });
  expect(redirect.headers()['location']).toMatch(/\/login\/2fa$/);
  const setCookies = redirect.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie').map((h) => h.value).join('\n');
  expect(setCookies).toContain('urls_2fa=');
  expect(setCookies).not.toContain('urls_sid=');
  await widget.dispose();

  // Disabling needs a code (here a recovery code)
  await page.goto('/dashboard/settings#two-factor');
  await section.getByRole('button', { name: '2FA ni o‘chirish' }).click();
  await section.getByLabel('Tasdiqlash kodi').fill(recovery[1]);
  await section.getByRole('button', { name: 'O‘chirish' }).click();
  await expect(section.getByText('O‘chiq.')).toBeVisible();
});

test('the code page needs the first login step, and guessing is rate limited', async ({ page, playwright }) => {
  // Without the first step there is nothing to confirm
  await page.goto('/login/2fa');
  await expect(page).toHaveURL(`${BASE}/`);

  await loginAsTelegramUser(page.request, 900000952, 'Guess Target');
  const setup = await (await page.request.post('/api/auth/2fa', { data: { action: 'setup' } })).json();
  await page.request.post('/api/auth/2fa', { data: { action: 'enable', code: codeAt(setup.secret, currentStep()) } });

  const attacker = await playwright.request.newContext({ baseURL: BASE });
  await attacker.post('/api/auth/telegram', { data: { action: 'verify-widget', widgetData: telegramWidgetData(900000952, 'Guess Target') } });
  const statuses: number[] = [];
  for (let i = 0; i < 7; i++) statuses.push((await attacker.post('/api/auth/2fa/verify', { data: { code: String(100000 + i) } })).status());
  expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
  expect(statuses.at(-1)).toBe(429);
  await attacker.dispose();
});
