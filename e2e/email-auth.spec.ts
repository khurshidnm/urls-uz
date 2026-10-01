import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { codeAt, currentStep } from '../src/lib/two-factor/totp';
import { E2E_ENV } from './env';
import { lastCodeTo, loginAsTelegramUser, mailsTo } from './helpers';

const BASE = 'http://localhost:3100';
const psql = (q: string) => execSync(`psql "${E2E_ENV.DATABASE_URL}" -Atc "${q}"`).toString().trim();

test('sign up with email from the login window, then sign in with email and password', async ({ page, playwright }) => {
  const email = 'yangi.mehmon@example.com';
  await page.goto('/');
  // "Boshlash" opens the sign-up screen
  await page.getByRole('button', { name: /Boshlash/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Ro‘yxatdan o‘tish' })).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Ismingiz').fill('Yangi Mehmon');
  await page.getByLabel('Parol', { exact: true }).fill('mustahkam-parol-1');
  await page.getByLabel('Parolni takrorlang').fill('mustahkam-parol-1');
  await page.getByRole('button', { name: 'Ro‘yxatdan o‘tish', exact: true }).click();
  await expect(page.getByText(`${email} manziliga 6 xonali kod yuborildi`)).toBeVisible();

  // The message went to ZeptoMail's API in its format
  const mail = mailsTo(email).at(-1)!;
  expect(mail.path).toBe('/v1.1/email');
  expect(mail.authorization).toBe('Zoho-enczapikey e2e-zepto-token');
  expect(mail.body.from.address).toBe('no-reply@urls.test');
  expect(mail.body.subject).toContain(lastCodeTo(email));

  await page.getByLabel('Tasdiqlash kodi').fill(lastCodeTo(email));
  await page.getByRole('button', { name: 'Tasdiqlash', exact: true }).click();
  await expect.poll(async () => (await (await page.request.get('/api/auth/me')).json()).user?.name).toBe('Yangi Mehmon');
  const userId = (await (await page.request.get('/api/auth/me')).json()).user.id;

  // A second visitor signs in with the email and password
  const v = await (await playwright.chromium.launch()).newContext({ baseURL: BASE });
  const p2 = await v.newPage();
  await p2.goto('/');
  await p2.getByRole('button', { name: 'Kirish' }).first().click();
  await p2.getByLabel('Email yoki login').fill(email);
  await p2.getByLabel('Parol', { exact: true }).fill('mustahkam-parol-1');
  await p2.locator('form').filter({ has: p2.getByLabel('Email yoki login') }).getByRole('button', { name: 'Kirish' }).click();
  await expect.poll(async () => (await (await p2.request.get('/api/auth/me')).json()).user?.id).toBe(userId);
  await v.close();
});

test('no account enumeration; codes expire after 5 wrong tries; reset signs out everywhere', async ({ playwright }) => {
  const api = await playwright.request.newContext({ baseURL: BASE });
  const post = (data: object) => api.post('/api/auth/email', { data });
  const email = 'tiklash@example.com';

  // Sign up
  await post({ action: 'signup', email, password: 'birinchi-parol-1', name: 'Tiklovchi' });
  // 5 wrong codes use the code up: even the right one fails afterwards
  const right = lastCodeTo(email);
  for (let i = 0; i < 5; i++) await post({ action: 'verify', email, code: right === '000000' ? '111111' : '000000' });
  expect((await post({ action: 'verify', email, code: right })).status()).toBe(400);
  // A new code works
  await post({ action: 'signup', email, password: 'birinchi-parol-1', name: 'Tiklovchi' });
  expect((await post({ action: 'verify', email, code: lastCodeTo(email) })).status()).toBe(200);

  // Signing up again: same answer, and the email says the account exists (no code)
  const before = mailsTo(email).length;
  expect(await (await post({ action: 'signup', email, password: 'boshqa-parol-1', name: 'X' })).json()).toEqual({ success: true, sent: true });
  expect(mailsTo(email).at(-1)!.body.subject).toContain('allaqachon ro‘yxatdan o‘tgan');
  expect(mailsTo(email).length).toBe(before + 1);

  // Wrong password and unknown email get the same message
  const wrong = await (await post({ action: 'login', email, password: 'xato-parol-1' })).json();
  const unknown = await (await post({ action: 'login', email: 'yoq@example.com', password: 'xato-parol-1' })).json();
  expect(wrong.error).toBe(unknown.error);
  // Reset for an unknown email: same answer, nothing sent
  expect(await (await post({ action: 'reset-request', email: 'yoq@example.com' })).json()).toEqual({ success: true, sent: true });
  expect(mailsTo('yoq@example.com')).toHaveLength(0);

  // Forgotten password: the reset signs out existing sessions
  expect((await api.get('/api/auth/me').then((r) => r.json())).user?.name).toBe('Tiklovchi');
  await post({ action: 'reset-request', email });
  expect((await post({ action: 'reset', email, code: lastCodeTo(email), password: 'ikkinchi-parol-2' })).status()).toBe(200);
  expect((await api.get('/api/auth/me').then((r) => r.json())).user).toBeNull();
  expect((await post({ action: 'login', email, password: 'birinchi-parol-1' })).status()).toBe(401);
  expect((await post({ action: 'login', email, password: 'ikkinchi-parol-2' })).status()).toBe(200);
  await api.dispose();
});

test('connect an email in settings; an email matching a Google account joins it; 2FA still applies', async ({ page, playwright }) => {
  const owner = await loginAsTelegramUser(page.request, 900000941, 'Ulovchi');
  const post = (data: object) => page.request.post('/api/auth/email', { data });
  await post({ action: 'connect-request', email: 'ulovchi@example.com', password: 'ulash-parol-11' });
  expect((await post({ action: 'connect-verify', email: 'ulovchi@example.com', code: lastCodeTo('ulovchi@example.com') })).status()).toBe(200);
  const identities = (await (await page.request.get('/api/auth/identities')).json()).identities;
  expect(identities.map((i: { provider: string }) => i.provider)).toContain('email');

  // Changing the email password needs the current one
  expect((await post({ action: 'change-password', currentPassword: 'xato', password: 'yangi-parol-33' })).status()).toBe(400);
  expect((await post({ action: 'change-password', currentPassword: 'ulash-parol-11', password: 'yangi-parol-33' })).status()).toBe(200);

  const other = await playwright.request.newContext({ baseURL: BASE });
  let res = await (await other.post('/api/auth/email', { data: { action: 'login', email: 'ulovchi@example.com', password: 'yangi-parol-33' } })).json();
  expect(res.user.id).toBe(owner.id);
  await other.dispose();

  // Same verified email as an existing (Google) account: sign-up joins that account
  const google = await playwright.request.newContext({ baseURL: BASE });
  const googleUser = await loginAsTelegramUser(google, 900000942, 'Google Egasi');
  psql(`update users set email = 'google.egasi@example.com' where id = '${googleUser.id}'`);
  const anon = await playwright.request.newContext({ baseURL: BASE });
  await anon.post('/api/auth/email', { data: { action: 'signup', email: 'google.egasi@example.com', password: 'qoshilish-parol-1', name: 'G' } });
  res = await (await anon.post('/api/auth/email', { data: { action: 'verify', email: 'google.egasi@example.com', code: lastCodeTo('google.egasi@example.com') } })).json();
  expect(res.user.id).toBe(googleUser.id);

  // 2FA: email sign-in stops at the code page
  const setup = await (await google.post('/api/auth/2fa', { data: { action: 'setup' } })).json();
  await google.post('/api/auth/2fa', { data: { action: 'enable', code: codeAt(setup.secret, currentStep()) } });
  const fresh = await playwright.request.newContext({ baseURL: BASE });
  res = await (await fresh.post('/api/auth/email', { data: { action: 'login', email: 'google.egasi@example.com', password: 'qoshilish-parol-1' } })).json();
  expect(res).toMatchObject({ success: true, twoFactorRequired: true });
  await Promise.all([google.dispose(), anon.dispose(), fresh.dispose()]);
});

test('sending codes is rate limited per address', async ({ playwright }) => {
  const api = await playwright.request.newContext({ baseURL: BASE });
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    statuses.push((await api.post('/api/auth/email', { data: { action: 'signup', email: 'spam@example.com', password: 'spam-parol-123', name: 'S' } })).status());
  }
  expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  await api.dispose();
});

test('login window: email and password first, then Google and Telegram; switch between sign in and sign up', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Kirish' }).first().click();
  await expect(page.getByRole('heading', { name: 'Kirish', exact: true })).toBeVisible();
  await expect(page.getByLabel('Email yoki login')).toBeVisible();
  await expect(page.getByLabel('Parol', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Parolni unutdingizmi?' })).toBeVisible();
  await expect(page.getByText('yoki', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google orqali kirish' })).toBeVisible();

  await page.getByRole('button', { name: 'Ro‘yxatdan o‘ting' }).click();
  await expect(page.getByRole('heading', { name: 'Ro‘yxatdan o‘tish' })).toBeVisible();
  await expect(page.getByLabel('Ismingiz')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Google orqali ro‘yxatdan o‘tish' })).toBeVisible();

  await page.getByRole('button', { name: 'Kiring', exact: true }).click();
  await expect(page.getByLabel('Email yoki login')).toBeVisible();
});
