import { test, expect, Page } from '@playwright/test';

/**
 * Visual regression snapshots of the main screens.
 * First run records baselines into e2e/visual.spec.ts-snapshots/;
 * subsequent runs compare against them (maxDiffPixelRatio tolerance).
 *
 * Update baselines:  npx playwright test e2e/visual.spec.ts --update-snapshots
 */

async function gotoApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  // Let entry animations settle
  await page.waitForTimeout(1200);
}

const SHOT = { maxDiffPixelRatio: 0.02, animations: 'disabled' as const };

test.describe('Visual snapshots', () => {
  test('chat list', async ({ page }) => {
    await gotoApp(page);
    await expect(page).toHaveScreenshot('chat-list.png', SHOT);
  });

  test('chat list — light theme', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Settings' }).first().click();
    await page.getByText('Theme').first().click();
    await page.locator('[title="Switch to Light Mode"]').first().click();
    await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Chats' }).first().click();
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('chat-list-light.png', SHOT);
  });

  test('open conversation', async ({ page }) => {
    await gotoApp(page);
    await page.getByText('Alice Freeman').first().click();
    await expect(page.getByPlaceholder('Message...').first()).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('chat-window.png', SHOT);
  });

  test('contacts identity screen', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Contacts' }).first().click();
    await expect(page.getByTestId('contacts-container')).toBeVisible();
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('contacts.png', SHOT);
  });

  test('calls screen', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Calls' }).first().click();
    await expect(page.getByPlaceholder('Search or dial...').first()).toBeVisible();
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('calls.png', SHOT);
  });

  test('settings main menu', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Settings' }).first().click();
    await expect(page.getByPlaceholder('Search settings')).toBeVisible();
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('settings-main.png', SHOT);
  });

  test('mobile viewport — chat list', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);
    await expect(page).toHaveScreenshot('chat-list-mobile.png', SHOT);
  });

  test('mobile viewport — conversation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoApp(page);
    await page.getByText('Alice Freeman').first().click();
    await expect(page.getByPlaceholder('Message...').first()).toBeVisible();
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('chat-window-mobile.png', SHOT);
  });
});
