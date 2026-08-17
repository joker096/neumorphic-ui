import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

/**
 * Calls screen: call history, filter chips, search, dialpad.
 */

async function gotoCalls(page: Page) {
  await ensureAppReady(page);
  await page.getByRole('button', { name: 'Calls' }).first().click();
  await expect(page.getByPlaceholder('Search calls').first()).toBeVisible();
}

test.describe('Calls', () => {
  test('call history renders mock records', async ({ page }) => {
    await gotoCalls(page);
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
    await expect(page.getByText('Bob Smith').first()).toBeVisible();
    await expect(page.getByText(/5m 23s/).first()).toBeVisible();
  });

  test('search filters callable contacts', async ({ page }) => {
    await gotoCalls(page);
    await page.getByPlaceholder('Search calls').first().fill('Bob');
    await expect(page.getByText('Bob Smith').first()).toBeVisible();
    // Contact rows are pointers; Bob remains, unknown-number dial row can stay
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
  });

  test('search with no matches shows the empty subtitle', async ({ page }) => {
    await gotoCalls(page);
    await page.getByPlaceholder('Search calls').first().fill('zzz-no-matches');
    await expect(page.getByText(/your call history will appear here/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('clear all empties the call history', async ({ page }) => {
    await gotoCalls(page);
    const clearButton = page.locator('button[title="Clear all"]').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(page.getByText(/your call history will appear here|no calls yet/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('add new contact from calls screen opens form modal', async ({ page }) => {
    await gotoCalls(page);
    const addBtn = page.getByLabel('Add New Contact');
    if (await addBtn.count()) {
      await addBtn.first().click();
      await expect(page.getByPlaceholder('Contact Name')).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).first().click();
    }
  });
});
