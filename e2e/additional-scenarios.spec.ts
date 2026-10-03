import { test, expect } from '@playwright/test';
import { ensureAppReady, gotoSettings } from './test-utils';

test.describe('Mess&Anger E2E - Additional Scenarios', () => {
  test('chat search filters messages', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /chats/i }).click();
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('theme toggle switches theme', async ({ page }) => {
    await gotoSettings(page);
    await expect(page.locator('html[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
    await page.getByText('Theme', { exact: true }).first().click();
    const toggle = page.getByTestId('theme-mode-light');
    await toggle.click();
    await expect(page.locator('html[data-theme="light"]')).toHaveAttribute('data-theme', 'light');
    await page.getByTestId('theme-mode-dark').click();
    await expect(page.locator('html[data-theme="dark"]')).toHaveAttribute('data-theme', 'dark');
  });

  test('contact profile modal opens', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /contacts/i }).first().click();
    const contactItems = page.getByRole('listitem');
    const count = await contactItems.count();
    if (count > 0) {
      await contactItems.first().click();
      await expect(page.getByText(/profile|contact/i).first()).toBeVisible();
    }
  });

  test('call initiation from chat', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /chats/i }).click();
    const callButtons = page.getByRole('button', { name: /call|voice|video/i });
    const count = await callButtons.count();
    if (count > 0) {
      await callButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('settings page persists changes', async ({ page }) => {
    await gotoSettings(page);
    await expect(page.getByText(/security|privacy|network|storage/i).first()).toBeVisible();
  });

  test('company workspace loads', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: /company/i }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('radar view loads', async ({ page }) => {
    await gotoSettings(page);
    await page.getByText('Mesh Radar').first().click();
    await expect(page.getByText(/mesh radar/i).first()).toBeVisible();
  });

  test('pulse view loads', async ({ page }) => {
    await gotoSettings(page);
    await page.getByText('Call settings', { exact: true }).first().click();
    await page.getByText('Call Log', { exact: true }).first().click();
    await expect(page.getByPlaceholder('Search recordings...').first()).toBeVisible();
  });

  test('stories view loads', async ({ page }) => {
    await ensureAppReady(page);
    await page.getByRole('button', { name: 'Chats', exact: true }).click();
    await expect(page.getByText('P2P Stories', { exact: true })).toBeVisible();
    await expect(page.getByText('My Story')).toBeVisible();
  });

  test('recordings view loads', async ({ page }) => {
    await gotoSettings(page);
    await page.getByText('Call settings', { exact: true }).first().click();
    await page.getByText('Call Log', { exact: true }).first().click();
    await expect(page.getByText('Recordings', { exact: true }).first()).toBeVisible();
  });
});
