import { expect, request as playwrightRequest, test, type APIRequestContext } from '@playwright/test';
import { loginAsTelegramUser, telegramWidgetData } from './helpers';

const BASE = 'http://localhost:3100';

/** Adds a Telegram login to the account logged in on `request`. */
const connectTelegram = (request: APIRequestContext, id: number, name: string) =>
  request.post('/api/auth/telegram', { data: { action: 'verify-widget', widgetData: telegramWidgetData(id, name), connect: true } });

test('one account, several login methods: connect, merge, disconnect', async ({ page }) => {
  // Account A logs in with Telegram and creates a link
  const a = await loginAsTelegramUser(page.request, 900000701, 'Aziz');
  await page.request.post('/api/links', { data: { destination_url: 'https://example.com/a', title: 'A link' } });

  // A second Telegram login connected from settings opens the same account
  let res = await connectTelegram(page.request, 900000702, 'Aziz ikkinchi');
  expect((await res.json()).outcome).toBe('connected');
  const other = await playwrightRequest.newContext({ baseURL: BASE });
  expect((await loginAsTelegramUser(other, 900000702, 'Aziz ikkinchi')).id).toBe(a.id);
  await other.dispose();

  // A separate account B with its own link, QR code and a same-named folder
  const b = await playwrightRequest.newContext({ baseURL: BASE });
  const bUser = await loginAsTelegramUser(b, 900000703, 'Aziz eski');
  expect(bUser.id).not.toBe(a.id);
  await b.post('/api/links', { data: { destination_url: 'https://example.com/b', title: 'B link' } });
  await b.post('/api/qr-codes', { data: { name: 'B QR', type: 'text', content: { text: 'salom' } } });
  await page.request.post('/api/folders', { data: { name: 'Ish' } });
  await b.post('/api/folders', { data: { name: 'Ish' } });

  // Connecting B's login method to A merges B into A
  res = await connectTelegram(page.request, 900000703, 'Aziz eski');
  expect((await res.json()).outcome).toBe('merged');
  const links = (await (await page.request.get('/api/links')).json()).links.map((l: { title: string }) => l.title);
  expect(links).toEqual(expect.arrayContaining(['A link', 'B link']));
  const qrCodes = (await (await page.request.get('/api/qr-codes')).json()).qrCodes.map((q: { name: string }) => q.name);
  expect(qrCodes).toContain('B QR');
  const folders = (await (await page.request.get('/api/folders')).json()).folders.map((f: { name: string }) => f.name).sort();
  expect(folders).toEqual(['Ish', 'Ish (2)']);
  // B's old session is gone; logging in with B's method now opens A
  expect((await (await b.get('/api/auth/me')).json()).user).toBeNull();
  expect((await loginAsTelegramUser(b, 900000703, 'Aziz eski')).id).toBe(a.id);
  await b.dispose();

  // Settings lists the login methods
  const identities = (await (await page.request.get('/api/auth/identities')).json()).identities;
  expect(identities.map((i: { providerId: string }) => i.providerId).sort()).toEqual(['900000701', '900000702', '900000703']);
  await page.goto('/dashboard/settings');
  await expect(page.getByRole('heading', { name: 'Kirish usullari' })).toBeVisible();
  await expect(page.getByText('Aziz ikkinchi')).toBeVisible();

  // Disconnecting works down to the last method
  for (const id of ['900000702', '900000703']) {
    res = await page.request.delete('/api/auth/identities', { data: { provider: 'telegram', providerId: id } });
    expect(res.status()).toBe(200);
  }
  res = await page.request.delete('/api/auth/identities', { data: { provider: 'telegram', providerId: '900000701' } });
  expect((await res.json()).code).toBe('LAST_LOGIN_METHOD');
  // A disconnected method starts a fresh account again
  const fresh = await playwrightRequest.newContext({ baseURL: BASE });
  expect((await loginAsTelegramUser(fresh, 900000702, 'Aziz ikkinchi')).id).not.toBe(a.id);
  await fresh.dispose();
});

test('connecting needs a session, and two bio pages are not merged silently', async ({ page }) => {
  const anonymous = await playwrightRequest.newContext({ baseURL: BASE });
  expect((await connectTelegram(anonymous, 900000711, 'Nobody')).status()).toBe(401);
  expect((await anonymous.get('/api/auth/identities')).status()).toBe(401);
  await anonymous.dispose();

  await loginAsTelegramUser(page.request, 900000712, 'Bio One');
  await page.request.post('/api/bio', { data: { handle: `bioone${Date.now().toString(36)}`, title: 'One', links: [] } });
  const other = await playwrightRequest.newContext({ baseURL: BASE });
  await loginAsTelegramUser(other, 900000713, 'Bio Two');
  await other.post('/api/bio', { data: { handle: `biotwo${Date.now().toString(36)}`, title: 'Two', links: [] } });

  const res = await connectTelegram(page.request, 900000713, 'Bio Two');
  expect(res.status()).toBe(409);
  expect((await res.json()).code).toBe('MERGE_CONFLICT_BIO');
  // Nothing changed: the other account still works on its own
  expect((await (await other.get('/api/auth/me')).json()).user.name).toBe('Bio Two');
  await other.dispose();
});

test('Google connect from settings is carried in the OAuth state', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000721, 'Google Linker');
  const res = await page.request.get('/api/auth/google?connect=1', { maxRedirects: 0 });
  const state = new URL(res.headers()['location']).searchParams.get('state');
  expect(state?.endsWith('.connect')).toBe(true);
});
