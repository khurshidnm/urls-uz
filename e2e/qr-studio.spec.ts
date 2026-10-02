import { expect, test } from '@playwright/test';
import { loginAsTelegramUser } from './helpers';

const ANDROID = { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14)' };

test('QR studio saves designs to existing links', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000601, 'QR Designer');
  const link = (await (await page.request.post('/api/links', { data: { destination_url: 'https://example.com/qr', title: 'QR target' } })).json()).link;

  // Old studio URLs still open the link
  await page.goto(`/dashboard/qr?link=${link.id}`);
  await expect(page).toHaveURL(new RegExp(`/dashboard/qr/new\\?link=${link.id}`));
  await expect(page.locator('#qr-link')).toHaveValue(link.id);
  await expect(page.getByRole('button', { name: 'Dizayn saqlangan' })).toBeDisabled();

  // Change the shape and frame text, then save to the link
  await page.getByRole('button', { name: /4\. Shakllar/ }).click();
  await page.getByRole('button', { name: 'Dots (Circles)' }).click();
  await page.getByRole('button', { name: 'VISIT LINK' }).click();
  await page.getByRole('button', { name: 'Dizaynni havolaga saqlash' }).click();
  await expect(page.getByText('QR dizayn havolaga saqlandi')).toBeVisible();

  const saved = (await (await page.request.get(`/api/links/${link.id}`)).json()).link.qr_config;
  expect(saved.bodyShape).toBe('dots');
  expect(saved.frameText).toBe('VISIT LINK');

  await page.goto(`/dashboard/qr/new?link=${link.id}`);
  await expect(page.getByRole('button', { name: 'Dizayn saqlangan' })).toBeVisible();
});

test('a dynamic vCard QR is saved, edited after printing and opens the current contact', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000602, 'Card Owner');

  await page.goto('/dashboard/qr');
  await expect(page.getByText('Hali saqlangan QR kod yo‘q')).toBeVisible();

  await page.goto('/dashboard/qr/new?type=vcard');
  await expect(page.getByRole('tab', { name: 'vCard' })).toHaveAttribute('aria-selected', 'true');
  // New QR codes start empty, not with sample data
  await expect(page.getByPlaceholder('Sherzod', { exact: true })).toHaveValue('');
  await page.getByPlaceholder('Sherzod', { exact: true }).fill('Aziz');
  await page.getByPlaceholder('Qosimov', { exact: true }).fill('Karimov');
  await page.getByPlaceholder('+998 90 123 45 67').fill('+998 90 111 22 33');
  await page.locator('#qr-name').fill('Vizitka');
  await expect(page.getByRole('radio', { name: /Dinamik/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'QR kodni saqlash' }).click();

  await expect(page).toHaveURL(/\/dashboard\/qr\/qr_/);
  await expect(page.getByRole('heading', { name: 'Vizitka' })).toBeVisible();
  const qrId = page.url().split('/').pop()!;
  let qr = (await (await page.request.get(`/api/qr-codes/${qrId}`)).json()).qrCode;
  expect(qr.type).toBe('vcard');
  expect(qr.link.slug).toBeTruthy();
  const slug: string = qr.link.slug;

  // Scanning opens the contact page, and the contact downloads as a .vcf
  await page.goto(`/${slug}`);
  await expect(page.getByRole('heading', { name: 'Aziz Karimov' })).toBeVisible();
  const vcf = await page.request.get(await page.getByRole('link', { name: 'Kontaktni saqlash' }).getAttribute('href') as string);
  expect(vcf.headers()['content-type']).toContain('text/vcard');
  expect(await vcf.text()).toContain('FN:Aziz Karimov');

  // Edit the contact after "printing": same short link, new content
  await page.goto(`/dashboard/qr/${qrId}`);
  await expect(page.getByRole('button', { name: 'Saqlangan' })).toBeDisabled();
  await page.getByPlaceholder('Qosimov', { exact: true }).fill('Rahimov');
  await page.getByRole('button', { name: 'O‘zgarishlarni saqlash' }).click();
  await expect(page.getByText('O‘zgarishlar saqlandi')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Saqlangan' })).toBeDisabled();

  await page.reload();
  await expect(page.getByPlaceholder('Qosimov', { exact: true })).toHaveValue('Rahimov');
  // A saved QR code keeps its type
  await expect(page.getByRole('tab', { name: 'Wi-Fi' })).toBeDisabled();

  await page.goto(`/${slug}`);
  await expect(page.getByRole('heading', { name: 'Aziz Rahimov' })).toBeVisible();

  // Scans are counted on the QR's link, which never changed: two browser visits and this one
  expect((await page.request.get(`/${slug}`, { headers: ANDROID })).status()).toBe(200);
  const getQr = async () => (await (await page.request.get(`/api/qr-codes/${qrId}`)).json()).qrCode;
  await expect.poll(async () => (await getQr()).link.click_count).toBe(3);
  qr = await getQr();
  expect(qr.link.slug).toBe(slug);

  // The library lists it
  await page.goto('/dashboard/qr');
  const card = page.getByRole('listitem').filter({ hasText: 'Vizitka' });
  await expect(card.getByText('Dinamik')).toBeVisible();
  await expect(card.getByText('Aziz Rahimov')).toBeVisible();

  // The link's destination follows the QR code and can't be changed from the links page
  const res = await page.request.patch(`/api/links/${qr.link.id}`, { data: { destination_url: 'https://example.com/elsewhere' } });
  expect(res.status()).toBe(400);
  expect((await res.json()).code).toBe('QR_MANAGED');

  // Deleting the QR code deletes its link
  expect((await page.request.delete(`/api/qr-codes/${qrId}`)).status()).toBe(200);
  expect((await page.request.get(`/api/links/${qr.link.id}`)).status()).toBe(404);
});

test('static QR codes can be saved, made dynamic later, but not back', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000603, 'Static Saver');
  const create = (data: Record<string, unknown>) => page.request.post('/api/qr-codes', { data });

  // Wi-Fi is static only
  let res = await create({ name: 'Ofis Wi-Fi', type: 'wifi', content: { ssid: 'Office', password: 'secret123', encryption: 'WPA' }, dynamic: true });
  expect(res.status()).toBe(400);
  expect((await res.json()).code).toBe('STATIC_ONLY');
  res = await create({ name: 'Ofis Wi-Fi', type: 'wifi', content: { ssid: 'Office', password: 'secret123', encryption: 'WPA' } });
  expect(res.status()).toBe(201);
  const wifi = (await res.json()).qrCode;
  expect(wifi.link).toBeNull();

  // Content is validated per type, and URLs go through the phishing filter
  res = await create({ name: 'Bo‘sh', type: 'event', content: { title: '' } });
  expect(res.status()).toBe(400);
  res = await create({ name: 'Soxta', type: 'url', content: { url: 'https://payme-security.example.com/login' }, dynamic: true });
  expect((await res.json()).code).toBe('PHISHING_SUSPECTED');

  // A static URL QR, converted to dynamic later
  res = await create({ name: 'Menyu', type: 'url', content: { url: 'example.com/menu' } });
  const menu = (await res.json()).qrCode;
  expect(menu.content.url).toBe('https://example.com/menu');
  expect(menu.link).toBeNull();

  res = await page.request.patch(`/api/qr-codes/${menu.id}`, { data: { dynamic: true } });
  const dynamicMenu = (await res.json()).qrCode;
  expect(dynamicMenu.link.slug).toBeTruthy();

  // Editing the URL changes where the printed QR goes
  await page.request.patch(`/api/qr-codes/${menu.id}`, { data: { content: { url: 'https://example.com/menu-v2' } } });
  const visit = await page.request.get(`/${dynamicMenu.link.slug}`, { maxRedirects: 0, headers: ANDROID });
  expect(visit.status()).toBe(307);
  expect(visit.headers()['location']).toBe('https://example.com/menu-v2');

  res = await page.request.patch(`/api/qr-codes/${menu.id}`, { data: { dynamic: false } });
  expect((await res.json()).code).toBe('ALREADY_DYNAMIC');

  // Other workspaces can't see or change it
  await loginAsTelegramUser(page.request, 900000604, 'Someone Else');
  expect((await page.request.get(`/api/qr-codes/${menu.id}`)).status()).toBe(404);
  expect((await page.request.patch(`/api/qr-codes/${menu.id}`, { data: { name: 'x' } })).status()).toBe(404);
  expect((await page.request.delete(`/api/qr-codes/${menu.id}`)).status()).toBe(404);
});

test('landing page QR studio works without an account and asks to sign up to save', async ({ page }) => {
  await page.goto('/#qr-studio');
  const studio = page.locator('#qr-studio');
  // Static QR types work for everyone; the vCard form is the landing default
  await expect(studio.getByRole('tab', { name: 'vCard' })).toHaveAttribute('aria-selected', 'true');
  await studio.getByRole('tab', { name: 'Havola' }).click();
  // No "my links" picker for visitors
  await expect(studio.getByRole('button', { name: 'Mening havolam' })).toHaveCount(0);
  await studio.locator('#qr-url').fill('https://example.com/menu');
  await studio.getByRole('button', { name: 'Ro‘yxatdan o‘tib saqlash' }).click();
  await expect(page.getByRole('heading', { name: 'Kirish', exact: true })).toBeVisible();
});
