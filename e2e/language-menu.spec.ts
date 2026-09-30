import { expect, test } from '@playwright/test';

test('language menu opens on click and stays open while choosing', async ({ page }) => {
  await page.goto('/dashboard');
  const button = page.getByRole('button', { name: 'Til / Язык / Language' });
  const menu = page.getByRole('menu');

  await button.click();
  await expect(menu).toBeVisible();
  // Moving the pointer off the button (into the gap and the list) keeps it open
  await page.mouse.move(0, 0);
  await expect(menu).toBeVisible();

  await menu.getByRole('menuitemradio', { name: 'Русский' }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Панель управления' })).toBeVisible();

  // Escape and a click outside close it
  await button.click();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await button.click();
  await page.getByRole('heading', { name: 'Панель управления' }).click();
  await expect(menu).toBeHidden();

  // The landing page uses the same menu
  await page.goto('/');
  await page.getByRole('button', { name: 'Til / Язык / Language' }).click();
  await page.getByRole('menuitemradio', { name: 'O‘zbekcha' }).click();
  await expect(page.getByRole('menuitemradio')).toHaveCount(0);
});
