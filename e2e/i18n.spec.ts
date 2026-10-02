import { expect, test } from '@playwright/test';
import { loginAsTelegramUser } from './helpers';

test('the chosen language covers the landing page, the dashboard and API errors', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Til / Язык / Language' }).first().click();
  await page.getByRole('menuitemradio', { name: 'Русский' }).click();

  // Sections that used to stay in Uzbek
  await expect(page.getByRole('heading', { name: 'Одна ссылка — каждое устройство в свой магазин' })).toBeVisible();
  await expect(page.getByText('ВСЕГО ПЕРЕХОДОВ')).toBeVisible();
  await expect(page.getByText('Bitta havola — har bir qurilma o‘z do‘koniga')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

  // The choice is a cookie too, so server-rendered pages follow it
  await loginAsTelegramUser(page.request, 900000701, 'Locale User');
  await page.goto('/dashboard/links');
  await expect(page.getByRole('heading', { name: 'Мои ссылки' })).toBeVisible();
  await expect(page).toHaveTitle(/Ссылки/);

  // Errors from the API (written in Uzbek) are shown in the chosen language
  await page.getByRole('button', { name: 'Новая ссылка' }).first().click();
  await page.getByLabel('Какую ссылку сократить?').fill('http://192.168.1.1/login');
  await page.getByRole('button', { name: 'Сократить' }).click();
  await expect(page.getByText('Правило безопасности: нельзя сокращать ссылки на IP-адреса (защита от фишинга).')).toBeVisible();
});

test('first visits follow the browser language; the 404 page too', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'One link — every device to its own store' })).toBeVisible();

  await page.goto('/no-such-link-here');
  await expect(page.getByRole('heading', { name: 'Page or link not found' })).toBeVisible();
  await expect(page).toHaveTitle(/Page not found/);
  await context.close();
});
