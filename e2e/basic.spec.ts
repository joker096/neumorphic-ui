import { test, expect } from '@playwright/test';
import { ensureAppReady } from './test-utils';

test.describe('Mess&Anger basic smoke tests', () => {
  test('app loads with dark theme by default', async ({ page }) => {
    await ensureAppReady(page);
    await expect(page.locator('[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
  });

  test('settings navigation works', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/network/i).first()).toBeVisible();
  });

  test('chat list is displayed', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /chats/i }).click();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('theme toggle switches between dark and light', async ({ page }) => {
    await ensureAppReady(page);
    await expect(page.locator('[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: /settings/i }).click();
    const toggle = page.getByRole('switch');
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(page.locator('[data-theme="light"]')).toHaveAttribute('data-theme', 'light');
    }
  });

  test('contacts page loads from hub', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /contacts/i }).first().click();
    await expect(page.getByText(/identity/i).first()).toBeVisible();
  });

  test('settings tabs are accessible', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/security|privacy|network|storage/i).first()).toBeVisible();
  });

  test('hub navigation renders all items', async ({ page }) => {
    await ensureAppReady(page);
    const hubItems = [/chats/i, /calls/i, /contacts/i, /company/i, /settings/i];
    for (const label of hubItems) {
      await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
    }
  });
});
