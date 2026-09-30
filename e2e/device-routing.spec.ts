import { expect, test } from '@playwright/test';
import { DEVICE_DEMO_APPS } from '../src/lib/device-demo';

const USER_AGENTS = {
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
  android: 'Mozilla/5.0 (Linux; Android 15; SM-S928B) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36',
  huawei: 'Mozilla/5.0 (Linux; Android 12; ALN-AL00; HMSCore 6.13) AppleWebKit/537.36 PetalBrowser/14.0',
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
};

test('the landing demo links send every device to its own store', async ({ request }) => {
  for (const app of DEVICE_DEMO_APPS) {
    const expected = { ios: app.ios, android: app.android, huawei: app.huawei ?? app.web, desktop: app.web };
    for (const [device, ua] of Object.entries(USER_AGENTS) as [keyof typeof USER_AGENTS, string][]) {
      const res = await request.get(`/${app.slug}`, { maxRedirects: 0, headers: { 'User-Agent': ua } });
      expect(res.status(), `${app.slug} on ${device}`).toBe(307);
      expect(res.headers()['location'], `${app.slug} on ${device}`).toBe(expected[device]);
    }
  }
});

test('landing section: pick an app, see each device’s destination and a scannable QR', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: USER_AGENTS.ios, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto('/#device-routing');
  const section = page.locator('#device-routing');

  await section.getByRole('radio', { name: /Payme/ }).click();
  await expect(section.getByText(/\/app-payme$/).first()).toBeVisible();
  await expect(section.locator('canvas').first()).toBeVisible();
  // The visitor's own device is recognized and preselected
  const iphone = section.getByRole('button', { name: /iPhone \/ iPad/ });
  await expect(iphone).toHaveAttribute('aria-pressed', 'true');
  await expect(iphone.getByText('SIZ')).toBeVisible();
  await expect(section.getByRole('link', { name: /Shu telefonda ochish/ })).toHaveAttribute('href', /\/app-payme$/);

  // Uzum has no AppGallery app: Huawei goes to the website
  await section.getByRole('radio', { name: /Uzum Market/ }).click();
  await expect(section.getByRole('button', { name: /Huawei/ })).toContainText('Veb-sayt (zaxira)');
  await context.close();
});
