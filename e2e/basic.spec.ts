import { test, expect } from '@playwright/test';

test.describe('Mess&Anger basic smoke tests', () => {
  test('app loads with dark theme by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('settings navigation works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/network/i)).toBeVisible();
  });

  test('chat list is displayed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /chats/i }).click();
    await expect(page.getByText(/messages/i)).toBeVisible();
  });

  test('theme toggle switches between dark and light', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark/);
    const themeBtn = page.getByRole('button', { name: /theme|light/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await expect(page.locator('html')).toHaveClass(/light/);
    }
  });

  test('contacts page loads from hub', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /contacts/i }).first().click();
    await expect(page.getByText(/contacts/i)).toBeVisible();
  });

  test('settings tabs are accessible', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/security|privacy|network|storage/i)).toBeVisible();
  });

  test('hub navigation renders all items', async ({ page }) => {
    await page.goto('/');
    const hubItems = [ /channels/i, /chats/i, /contacts/i, /calls/i, /settings/i ];
    for (const label of hubItems) {
      await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
    }
  });
});
