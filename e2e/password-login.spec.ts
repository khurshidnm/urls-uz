import { expect, test } from '@playwright/test';
import { codeAt, currentStep } from '../src/lib/two-factor/totp';
import { loginAsTelegramUser } from './helpers';

const BASE = 'http://localhost:3100';

test('set a login and password in settings, then sign in with them from the login window', async ({ page, playwright }) => {
  const owner = await loginAsTelegramUser(page.request, 900000931, 'Parol Egasi');
  await page.goto('/dashboard/settings#login-methods');
  await page.getByRole('button', { name: 'Login va parol o‘rnatish' }).click();
  const form = page.locator('#login-methods form');
  await form.getByLabel('Login').fill('Parol_Egasi');
  await form.getByLabel('Parol', { exact: true }).fill('yaxshi-parol-2026');
  await form.getByLabel('Parolni takrorlang').fill('boshqa');
  await expect(form.getByText('Parollar mos emas')).toBeVisible();
  await form.getByLabel('Parolni takrorlang').fill('yaxshi-parol-2026');
  await form.getByRole('button', { name: 'Saqlash' }).click();
  await expect(page.getByText(/«parol_egasi» login va parolingiz bilan/)).toBeVisible();
  await expect(page.locator('#login-methods').getByText('parol_egasi')).toBeVisible();

  // Sign in from the landing page's login window
  const visitor = await (await playwright.chromium.launch()).newContext({ baseURL: BASE });
  const v = await visitor.newPage();
  await v.goto('/');
  await v.getByRole('button', { name: 'Kirish' }).first().click();
  await v.getByRole('button', { name: 'Email', exact: true }).click();
  await v.getByLabel('Email yoki login').fill('parol_egasi');
  await v.getByLabel('Parol', { exact: true }).fill('noto‘g‘ri-parol');
  await v.locator('form').filter({ has: v.getByLabel('Email yoki login') }).getByRole('button', { name: 'Kirish' }).click();
  await expect(v.getByText('Login yoki parol noto‘g‘ri')).toBeVisible();
  await v.getByLabel('Parol', { exact: true }).fill('yaxshi-parol-2026');
  await v.locator('form').filter({ has: v.getByLabel('Email yoki login') }).getByRole('button', { name: 'Kirish' }).click();
  await expect.poll(async () => (await (await v.request.get('/api/auth/me')).json()).user?.id).toBe(owner.id);
  await visitor.close();
});

test('password rules, taken logins, changing needs the current password, same error for unknown logins', async ({ page, playwright }) => {
  await loginAsTelegramUser(page.request, 900000932, 'Qoida Tekshiruvchi');
  const set = (data: object) => page.request.put('/api/auth/password', { data });

  expect((await set({ login: 'qoida_user', password: 'qisqa' })).status()).toBe(400);
  expect((await set({ login: 'qoida_user', password: '12345678' })).status()).toBe(400);
  expect((await set({ login: 'x', password: 'yaxshi-parol-1' })).status()).toBe(400);
  expect((await set({ login: 'qoida_user', password: 'yaxshi-parol-1' })).status()).toBe(200);

  // Someone else can't take the same login
  const other = await playwright.request.newContext({ baseURL: BASE });
  await loginAsTelegramUser(other, 900000933, 'Boshqa Odam');
  const taken = await other.put('/api/auth/password', { data: { login: 'qoida_user', password: 'boshqa-parol-1' } });
  expect((await taken.json()).code).toBe('LOGIN_TAKEN');
  await other.dispose();

  // Changing needs the current password
  let res = await set({ login: 'qoida_user', password: 'yangi-parol-22', currentPassword: 'xato' });
  expect((await res.json()).code).toBe('WRONG_PASSWORD');
  res = await set({ login: 'qoida_user', password: 'yangi-parol-22', currentPassword: 'yaxshi-parol-1' });
  expect(res.status()).toBe(200);

  const anon = await playwright.request.newContext({ baseURL: BASE });
  const signIn = (login: string, password: string) => anon.post('/api/auth/password', { data: { login, password } });
  const wrong = await (await signIn('qoida_user', 'yaxshi-parol-1')).json();
  const unknown = await (await signIn('hech_kim_yoq', 'yaxshi-parol-1')).json();
  expect(wrong.error).toBe(unknown.error);
  expect((await signIn('QOIDA_USER', 'yangi-parol-22')).status()).toBe(200);
  await anon.dispose();

  // Removing the method turns password sign-in off
  const identities = (await (await page.request.get('/api/auth/identities')).json()).identities;
  expect(identities.some((i: { provider: string }) => i.provider === 'password')).toBe(true);
  await page.request.delete('/api/auth/identities', { data: { provider: 'password', providerId: 'qoida_user' } });
  const after = await playwright.request.newContext({ baseURL: BASE });
  expect((await after.post('/api/auth/password', { data: { login: 'qoida_user', password: 'yangi-parol-22' } })).status()).toBe(401);
  await after.dispose();
});

test('password sign-in still asks for the 2FA code, and guessing is rate limited', async ({ page, playwright }) => {
  await loginAsTelegramUser(page.request, 900000934, 'Ikki Qavat');
  await page.request.put('/api/auth/password', { data: { login: 'ikki_qavat', password: 'mustahkam-parol-9' } });
  const setup = await (await page.request.post('/api/auth/2fa', { data: { action: 'setup' } })).json();
  await page.request.post('/api/auth/2fa', { data: { action: 'enable', code: codeAt(setup.secret, currentStep()) } });

  const ctx = await playwright.request.newContext({ baseURL: BASE });
  const res = await (await ctx.post('/api/auth/password', { data: { login: 'ikki_qavat', password: 'mustahkam-parol-9' } })).json();
  expect(res).toMatchObject({ success: true, twoFactorRequired: true });
  expect((await (await ctx.get('/api/auth/me')).json()).user).toBeNull();

  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) statuses.push((await ctx.post('/api/auth/password', { data: { login: 'ikki_qavat', password: `taxmin-${i}-parol` } })).status());
  expect(statuses.at(-1)).toBe(429);
  await ctx.dispose();
});
