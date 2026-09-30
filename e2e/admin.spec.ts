import { execSync } from 'child_process';
import { expect, test } from '@playwright/test';
import { E2E_ENV } from './env';
import { loginAsTelegramUser } from './helpers';

const psql = (query: string) => execSync(`psql "${E2E_ENV.DATABASE_URL}" -Atc "${query}"`).toString().trim();
const BASE = 'http://localhost:3100';

test('admin panel: only superadmins; payments turn on paid features until the period ends', async ({ page, playwright }) => {
  // A regular user with a link
  const customer = await playwright.request.newContext({ baseURL: BASE });
  const user = await loginAsTelegramUser(customer, 900000991, 'Mijoz Karimov');
  await customer.post('/api/links', { data: { destination_url: 'https://example.com/customer' } });
  const workspaceId: string = (await (await customer.get('/api/auth/me')).json()).workspace.id;
  // Activity is recorded
  expect(psql(`select last_seen_at is not null from users where id = '${user.id}'`)).toBe('t');

  // Not for regular users
  const asCustomer = await customer.post(`/api/admin/workspaces/${workspaceId}/plan`, { data: { plan: 'pro', months: 12, amount: 0 } });
  expect(asCustomer.status()).toBe(403);
  expect((await customer.get('/dashboard/admin')).status()).toBe(404);

  // The admin sees platform numbers and the user
  await loginAsTelegramUser(page.request, 900000990, 'Platform Admin');
  await page.goto('/dashboard/admin');
  await expect(page.getByRole('heading', { name: 'Admin panel' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Admin', exact: true })).toBeVisible();
  await page.getByLabel('Foydalanuvchilarni qidirish').fill('Mijoz');
  await page.keyboard.press('Enter');
  const row = page.getByRole('row').filter({ hasText: 'Mijoz Karimov' });
  await expect(row).toContainText('Bepul');
  await row.getByRole('link', { name: 'Mijoz Karimov' }).click();

  // Record a payment from the user's page
  await expect(page.getByRole('heading', { name: 'Mijoz Karimov', level: 1 })).toBeVisible();
  await expect(page.getByText('To‘lov qilinmagan.')).toBeVisible();
  await page.getByRole('button', { name: '3', exact: true }).click();
  await page.getByPlaceholder('0 — sovg‘a yoki sinov').fill('297000');
  await page.getByPlaceholder('Chek raqami, kelishuv…').fill('Chek #1042');
  await page.getByRole('button', { name: 'Tarif berish' }).click();
  await expect(page.getByText('To‘lov qayd etildi, tarif berildi')).toBeVisible();
  await expect(page.getByText('297,000 so‘m').first()).toBeVisible();
  await expect(page.getByText('Chek #1042')).toBeVisible();

  // The customer now has paid features (API keys)
  expect((await customer.post('/api/api-keys', { data: { name: 'After payment' } })).status()).toBe(201);

  // Renewing the same plan extends from the current end date
  const firstEnd = psql(`select plan_expires_at from workspaces where id = '${workspaceId}'`);
  const renew = await page.request.post(`/api/admin/workspaces/${workspaceId}/plan`, { data: { plan: 'pro', months: 1, amount: 99000 } });
  expect(renew.status()).toBe(201);
  expect(new Date((await renew.json()).payment.period_start).getTime()).toBe(new Date(firstEnd).getTime());

  // A plan past its end date acts as free
  psql(`update workspaces set plan_expires_at = now() - interval '1 day' where id = '${workspaceId}'`);
  const expired = await customer.post('/api/api-keys', { data: { name: 'Expired' } });
  expect((await expired.json()).code).toBe('PLAN_REQUIRED');
  await page.goto('/dashboard/admin?q=Mijoz');
  await expect(page.getByRole('row').filter({ hasText: 'Mijoz Karimov' })).toContainText('tugagan');

  // Ending a plan
  psql(`update workspaces set plan_expires_at = now() + interval '5 days' where id = '${workspaceId}'`);
  expect((await page.request.delete(`/api/admin/workspaces/${workspaceId}/plan`)).status()).toBe(200);
  expect(psql(`select plan from workspaces where id = '${workspaceId}'`)).toBe('free');
  // Payments stay as history
  expect(psql(`select count(*) from payments where workspace_id = '${workspaceId}'`)).toBe('2');
  await customer.dispose();
});
