import { expect, test } from '@playwright/test';
import { loginAsTelegramUser } from './helpers';

test('QR studio saves designs to links and turns URLs into dynamic QR codes', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000601, 'QR Designer');
  const link = (await (await page.request.post('/api/links', { data: { destination_url: 'https://example.com/qr', title: 'QR target' } })).json()).link;

  // Opening the studio on a link loads that link
  await page.goto(`/dashboard/qr?link=${link.id}`);
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

  // Reloading shows the saved design as current
  await page.goto(`/dashboard/qr?link=${link.id}`);
  await expect(page.getByRole('button', { name: 'Dizayn saqlangan' })).toBeVisible();

  // A typed URL is a static QR until it's turned into a short link
  await page.getByRole('button', { name: 'Ixtiyoriy URL (statik)', exact: true }).click();
  await page.locator('#qr-url').fill('https://example.com/printed-flyer');
  await expect(page.getByText(/Statik QR: URL QR ichiga yoziladi/)).toBeVisible();
  await page.getByRole('button', { name: 'Qisqa havola orqali dinamik qilish' }).click();
  await expect(page.getByText(/Dinamik QR tayyor/)).toBeVisible();

  const links = (await (await page.request.get('/api/links')).json()).links as { destination_url: string; qr_config: { bodyShape?: string } | null }[];
  const created = links.find((l) => l.destination_url === 'https://example.com/printed-flyer');
  expect(created?.qr_config?.bodyShape).toBe('dots');

  // Other content types are labeled as static
  await page.getByRole('tab', { name: 'Wi-Fi' }).click();
  await expect(page.getByText(/ma’lumot QR ichiga yoziladi/)).toBeVisible();
});
