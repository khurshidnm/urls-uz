import { expect, test } from '@playwright/test';
import { loginAsTelegramUser, telegramWidgetData } from './helpers';

test('shortening before logging in: a redirect login comes back to the card with the new link', async ({ page }) => {
  await page.goto('/');
  // Only the URL field, paste and the button: no decorative "urls.uz/ ···" box
  await expect(page.getByText('urls.uz/', { exact: true })).toHaveCount(0);

  // What the auth modal stores when a visitor presses Shorten before logging in
  await page.context().addCookies([{ name: 'urls_pending_url', value: encodeURIComponent('https://example.com/before-login'), url: 'http://localhost:3100' }]);
  const params = new URLSearchParams(telegramWidgetData(900000981, 'Yangi Mehmon'));
  const login = await page.request.get(`/api/auth/telegram/callback?${params}`, { maxRedirects: 0 });
  const location = login.headers()['location'];
  expect(location).toMatch(/\/\?shortened=link_/);

  // The redirect uses the configured public address; stay on the test server
  const target = new URL(location);
  await page.goto(`${target.pathname}${target.search}`);
  const card = page.locator('#shorten');
  await expect(card.getByText('Yaratildi:')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Nusxa' })).toBeVisible();
  const shortLink = await card.getByRole('link').filter({ hasText: /\/[A-Za-z0-9]{5}$/ }).innerText();
  const created = (await (await page.request.get('/api/links')).json()).links.find((l: { destination_url: string }) => l.destination_url === 'https://example.com/before-login');
  expect(shortLink.endsWith(`/${created.slug}`)).toBe(true);
  // The address is cleaned, so a reload doesn't show it again
  await expect(page).toHaveURL('http://localhost:3100/');

  // Someone else's link id shows nothing
  await page.context().clearCookies();
  await loginAsTelegramUser(page.request, 900000982, 'Boshqa Odam');
  await page.goto(`/?shortened=${created.id}`);
  await page.waitForTimeout(500);
  await expect(page.locator('#shorten').getByText('Yaratildi:')).toHaveCount(0);
});
