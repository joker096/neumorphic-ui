import { test, expect } from '@playwright/test';
import { ensureAppReady, gotoSettings } from './test-utils';

test.describe('Mess&Anger basic smoke tests', () => {
  test('app loads with dark theme by default', async ({ page }) => {
    await ensureAppReady(page);
    await expect(page.locator('html[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
  });

  test('settings navigation works', async ({ page }) => {
    await gotoSettings(page);
    await expect(page.getByText(/network/i).first()).toBeVisible();
  });

  test('chat list is displayed', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /chats/i }).click();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test('theme toggle switches between dark and light', async ({ page }) => {
    await gotoSettings(page);
    await expect(page.locator('html[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
    await page.getByText('Theme', { exact: true }).first().click();
    await page.getByTestId('theme-mode-light').click();
    await expect(page.locator('html[data-theme="light"]')).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('theme-mode-dark').click();
    await expect(page.locator('html[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
  });

  test('contacts page loads from hub', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /contacts/i }).first().click();
    await expect(page.getByText(/identity/i).first()).toBeVisible();
  });

  test('settings tabs are accessible', async ({ page }) => {
    await gotoSettings(page);
    await expect(page.getByText(/security|privacy|network|storage/i).first()).toBeVisible();
  });

  test('hub navigation renders all items', async ({ page }) => {
    await ensureAppReady(page);
    const hubItems = [/chats/i, /calls/i, /contacts/i, /company/i];
    for (const label of hubItems) {
      await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
    }
    // Workplace is admin-only: hidden when the user has no company
    await expect(page.getByRole('button', { name: /workplace/i })).toHaveCount(0);
    // Settings is reached through the profile button
    await expect(page.getByRole('button', { name: 'User', exact: true }).first()).toBeVisible();
  });
});
