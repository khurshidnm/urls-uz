import { expect, test } from '@playwright/test';
import { loginAsTelegramUser } from './helpers';

test('links table: filters in the URL, folders and bulk actions', async ({ page }) => {
  await loginAsTelegramUser(page.request, 900000401, 'Table User');
  const folder = (await (await page.request.post('/api/folders', { data: { name: 'Aksiya' } })).json()).folder;
  const make = async (data: Record<string, unknown>) => (await (await page.request.post('/api/links', { data })).json()).link;
  await make({ destination_url: 'https://example.com/a', title: 'Alpha sale', tags: ['promo'], folder_id: folder.id });
  await make({ destination_url: 'https://example.com/b', title: 'Beta jobs', tags: ['hr'] });
  await make({ destination_url: 'https://example.com/c', title: 'Gamma promo', tags: ['promo'] });

  await page.goto('/dashboard/links');
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(3);

  // Search is debounced into the URL and filtered on the server
  await page.getByLabel('Havolalarni qidirish').fill('beta');
  await expect(page).toHaveURL(/q=beta/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Beta jobs');

  // Tag chips filter too; the URL is shareable
  await page.goto('/dashboard/links?tag=promo');
  await expect(rows).toHaveCount(2);

  // Folder filter
  await page.goto('/dashboard/links');
  await page.getByRole('button', { name: /^Aksiya/ }).click();
  await expect(page).toHaveURL(new RegExp(`folder=${folder.id}`));
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Alpha sale');

  // Bulk: select all on the unfiltered page, add a tag, then archive
  await page.goto('/dashboard/links');
  await page.getByLabel('Barchasini tanlash').check();
  const bulk = page.getByRole('toolbar', { name: 'Tanlangan havolalar amallari' });
  await expect(bulk).toContainText('3 ta tanlandi');
  await bulk.getByRole('button', { name: 'Teg', exact: true }).click();
  await page.getByPlaceholder('teg nomi').fill('q4');
  await bulk.getByRole('button', { name: 'Qo‘shish' }).click();
  await expect(page.getByText('3 ta havola yangilandi')).toBeVisible();
  await expect(page.locator('tbody').getByText('#q4')).toHaveCount(3);

  await page.getByLabel('Barchasini tanlash').check();
  await bulk.getByRole('button', { name: 'Arxivlash', exact: true }).click();
  await expect(rows).toHaveCount(0);
  await expect(page.getByText('Faol havolalar yo‘q')).toBeVisible();
  await page.getByRole('button', { name: 'Arxivni ko‘rish' }).click();
  await expect(page).toHaveURL(/status=archived/);
  await expect(rows).toHaveCount(3);

  // Row delete needs a second click to confirm
  await rows.first().getByTitle('O‘chirish').click();
  await expect(rows).toHaveCount(3);
  await rows.first().getByRole('button', { name: 'Tasdiqlash' }).click();
  await expect(rows).toHaveCount(2);

  // History records bulk changes like any other edit
  const remaining = (await (await page.request.get('/api/links?status=archived')).json()).links[0];
  const history = (await (await page.request.get(`/api/links/${remaining.id}/history`)).json()).events;
  expect(history.map((e: { action: string }) => e.action)).toEqual(['archived', 'updated', 'created']);
});

test('bulk API reports partial failures and ignores other workspaces', async ({ page, playwright }) => {
  await loginAsTelegramUser(page.request, 900000402, 'Bulk Owner');
  const mine = (await (await page.request.post('/api/links', { data: { destination_url: 'https://example.com/mine' } })).json()).link;

  const other = await playwright.request.newContext({ baseURL: 'http://localhost:3100' });
  await loginAsTelegramUser(other, 900000403, 'Bulk Other');
  const theirs = (await (await other.post('/api/links', { data: { destination_url: 'https://example.com/theirs' } })).json()).link;

  const res = await page.request.post('/api/links/bulk', { data: { action: 'delete', ids: [mine.id, theirs.id] } });
  const body = await res.json();
  expect(body.succeeded).toEqual([mine.id]);
  expect(body.failed.map((f: { id: string }) => f.id)).toEqual([theirs.id]);
  expect((await other.get('/api/links')).ok()).toBe(true);
  expect((await (await other.get('/api/links')).json()).links).toHaveLength(1);

  expect((await page.request.post('/api/links/bulk', { data: { action: 'archive', ids: [] } })).status()).toBe(400);
  await other.dispose();
});
