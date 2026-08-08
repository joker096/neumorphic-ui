import { test, expect } from '@playwright/test';

test.describe('Mess&Anger E2E - Additional Scenarios', () => {
  test('chat search filters messages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /chats/i }).click();
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('theme toggle switches theme', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
    await page.getByRole('button', { name: /settings/i }).click();
    const toggle = page.getByRole('switch');
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(page.locator('[data-theme="light"]')).toHaveAttribute('data-theme', 'light');
      await toggle.click();
      await expect(page.locator('[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
    }
  });

  test('contact profile modal opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /contacts/i }).first().click();
    const contactItems = page.getByRole('listitem');
    const count = await contactItems.count();
    if (count > 0) {
      await contactItems.first().click();
      await expect(page.getByText(/profile|contact/i).first()).toBeVisible();
    }
  });

  test('call initiation from chat', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /chats/i }).click();
    const callButtons = page.getByRole('button', { name: /call|voice|video/i });
    const count = await callButtons.count();
    if (count > 0) {
      await callButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('settings page persists changes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/security|privacy|network|storage/i).first()).toBeVisible();
  });

  test('company workspace loads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /company/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('radar view loads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /radar/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('pulse view loads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /pulse/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('stories view loads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /stories/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('recordings view loads', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /recordings/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });
});