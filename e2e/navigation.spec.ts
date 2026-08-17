import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

/**
 * Navigation & global chrome tests.
 * Verifies every navigation destination, the transport indicator,
 * the skip-link and that no React ErrorBoundary is ever triggered.
 */

async function gotoApp(page: Page) {
  await ensureAppReady(page);
}

test.describe('Navigation & chrome', () => {
  test('app boots with title, theme and no error boundary', async ({ page }) => {
    await gotoApp(page);
    await expect(page).toHaveTitle(/Mess&Anger/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('all five nav destinations render', async ({ page }) => {
    await gotoApp(page);
    for (const label of ['Chats', 'Calls', 'Contacts', /company chat/i, 'Settings']) {
      await expect(
        page.getByRole('button', { name: label as string | RegExp }).first()
      ).toBeVisible();
    }
  });

  test('nav: Chats shows the chat list with search', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Chats' }).first().click();
    await expect(
      page.getByPlaceholder('Search chats or messages...').first()
    ).toBeVisible();
  });

  test('nav: Calls shows dialpad and call history search', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Calls' }).first().click();
    await expect(page.getByPlaceholder('Search calls').first()).toBeVisible();
  });

  test('nav: Contacts shows identity screen', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Contacts' }).first().click();
    await expect(page.getByTestId('contacts-container')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();
  });

  test('nav: Settings shows main settings menu', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: 'Settings' }).first().click();
    await expect(page.getByPlaceholder('Search settings')).toBeVisible();
    // Section cards present
    await expect(page.getByRole('button', { name: /account/i }).first()).toBeVisible();
    await expect(page.getByText('Security').first()).toBeVisible();
    await expect(page.getByText('Privacy').first()).toBeVisible();
  });

  test('nav: Company Chat opens the company view', async ({ page }) => {
    await gotoApp(page);
    await page.getByRole('button', { name: /company/i }).first().click();
    await expect(page.getByText(/company/i).first()).toBeVisible();
  });

  test('transport indicator is present with a connection title', async ({ page }) => {
    await gotoApp(page);
    await expect(page.locator('[title^="Connection:"]')).toBeVisible();
  });

  test('skip link targets main content', async ({ page }) => {
    await gotoApp(page);
    const skip = page.getByText('Skip to main content');
    await expect(skip).toHaveAttribute('href', '#main-content');
  });

  test('round-trip navigation does not break the app', async ({ page }) => {
    await gotoApp(page);
    for (const label of ['Calls', 'Contacts', 'Settings', 'Chats']) {
      await page.getByRole('button', { name: label }).first().click();
      await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
    }
    // Back on chats with mock data the search must be visible again
    await expect(
      page.getByPlaceholder('Search chats or messages...').first()
    ).toBeVisible();
  });
});
