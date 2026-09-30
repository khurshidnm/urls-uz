import { expect, test } from '@playwright/test';
import { loginAsTelegramUser } from './helpers';

type Button = { id: string; title: string; url: string; link_id: string | null; short_slug: string | null; click_count: number };

test('bio buttons are real links: tracked, editable without losing stats, cleaned up', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000501, 'Bio Owner');
  const handle = `bio_${Date.now().toString(36)}`;
  const save = (links: Record<string, unknown>[]) => page.request.post('/api/bio', { data: { handle, title: 'Bio Owner', links } });

  let res = await save([
    { title: 'Sayt', url: 'https://example.com/site' },
    { title: 'Kanal', url: 'https://t.me/example' },
    { title: 'Qo‘ng‘iroq', url: 'tel:+998901234567' },
  ]);
  expect(res.status()).toBe(200);
  let buttons: Button[] = (await res.json()).bioPage.links;
  expect(buttons[0].link_id).toBeTruthy();
  expect(buttons[0].short_slug).toBeTruthy();
  expect(buttons[2].link_id).toBeNull();

  // Bio links don't use up the plan's link quota
  const usage = await (await page.request.get('/api/workspace/usage')).json();
  expect(usage.usage.activeLinks).toBe(0);

  // The public page opens buttons through their short link
  await page.goto(`/b/${handle}`);
  await page.evaluate(() => {
    (window as unknown as { opened: string[] }).opened = [];
    window.open = ((url: string) => {
      (window as unknown as { opened: string[] }).opened.push(url);
      return null;
    }) as typeof window.open;
  });
  await page.getByRole('button', { name: /Sayt/ }).click();
  const opened = await page.evaluate(() => (window as unknown as { opened: string[] }).opened);
  expect(opened).toEqual([`/${buttons[0].short_slug}`]);

  // A visit through that link is a normal, analyzed click
  const visit = await page.request.get(`/${buttons[0].short_slug}`, {
    maxRedirects: 0,
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14)' },
  });
  expect(visit.status()).toBe(307);
  expect(visit.headers()['location']).toBe('https://example.com/site');
  const analytics = await (await page.request.get(`/api/analytics?link_id=${buttons[0].link_id}`)).json();
  expect(analytics.clicks[0].os).toBe('Android');

  // Editing a button keeps its link and statistics
  res = await save([
    { id: buttons[0].id, title: 'Sayt (yangi)', url: 'https://example.com/site-v2' },
    { id: buttons[2].id, title: 'Qo‘ng‘iroq', url: 'tel:+998901234567' },
  ]);
  const updated: Button[] = (await res.json()).bioPage.links;
  expect(updated[0].link_id).toBe(buttons[0].link_id);
  expect(updated[0].click_count).toBe(1);
  const link = (await (await page.request.get(`/api/links/${buttons[0].link_id}`)).json()).link;
  expect(link.destination_url).toBe('https://example.com/site-v2');

  // The removed "Kanal" button's link is gone
  expect((await page.request.get(`/api/links/${buttons[1].link_id}`)).status()).toBe(404);

  // Button URLs go through the phishing filter, and the error names the button
  res = await save([{ title: 'Soxta bank', url: 'https://payme-security.example.com/login' }]);
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toContain('Soxta bank');
});
