import { expect, test } from '@playwright/test';
import { loginAsTelegramUser } from './helpers';

test('landing page SEO: title, description, canonical, social previews, structured data', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/urls\.uz — havolalarni qisqartirish/);
  const meta = (selector: string) => page.locator(selector).first().getAttribute('content');
  expect(await meta('meta[name="description"]')).toContain('qisqa havolalar');
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/^https?:\/\/[^/]+\/?$/);
  expect(await meta('meta[property="og:image"]')).toMatch(/\/opengraph-image/);
  expect(await meta('meta[property="og:locale"]')).toBe('uz_UZ');
  expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  expect(await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href')).toMatch(/\/icon\.svg/);
  expect(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href')).toMatch(/\/apple-icon/);
  expect(await page.locator('link[hreflang="ru"]').count()).toBe(1);

  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) || '{}');
  expect(ld['@graph'].map((n: { '@type': string }) => n['@type'])).toEqual(['Organization', 'WebSite', 'SoftwareApplication']);
});

test('icons, social image, robots.txt, sitemap and manifest are served', async ({ request }) => {
  const icon = await request.get('/icon.svg');
  expect(icon.headers()['content-type']).toContain('image/svg+xml');
  for (const path of ['/apple-icon', '/opengraph-image']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type'], path).toContain('image/png');
  }

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /dashboard');
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('<loc>');
  expect(sitemap).toContain('/b/apextech');

  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.name).toBe('urls.uz');
});

test('bio pages have their own title and canonical; app pages are not indexed', async ({ page }) => {
  await page.goto('/b/apextech');
  await expect(page).toHaveTitle('ApexTech Solutions (@apextech) — urls.uz');
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/\/b\/apextech$/);

  await page.goto('/dashboard/links');
  await expect(page).toHaveTitle('Havolalar — urls.uz');
  expect(await page.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
});

test('logging out goes to the landing page, not the demo dashboard', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000971, 'Chiquvchi');
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Chiqish' }).click();
  await expect(page).toHaveURL('http://localhost:3100/');
  expect((await (await page.request.get('/api/auth/me')).json()).user).toBeNull();
});
