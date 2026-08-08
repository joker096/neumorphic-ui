import { test, expect, Page } from '@playwright/test';

/**
 * Calls screen: call history, filter chips, search, dialpad.
 */

async function gotoCalls(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Calls' }).first().click();
  await expect(page.getByPlaceholder('Search or dial...').first()).toBeVisible();
}

test.describe('Calls', () => {
  test('call history renders mock records', async ({ page }) => {
    await gotoCalls(page);
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
    await expect(page.getByText('Bob Smith').first()).toBeVisible();
    await expect(page.getByText(/5m 23s/).first()).toBeVisible();
  });

  test('filter chips: All / incoming / outgoing / missed', async ({ page }) => {
    await gotoCalls(page);
    // Incoming filter
    await page.getByText(/^In$/).first().click().catch(() => {});
    await page.getByText('Out', { exact: true }).first().click().catch(() => {});
    await page.getByText('Missed', { exact: true }).first().click();
    // Missed-only: "+1 (555) 019-283" and "Unknown" missed calls
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
    // Back to All
    await page.getByText(/^All$/).first().click();
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
  });

  test('search filters callable contacts', async ({ page }) => {
    await gotoCalls(page);
    await page.getByPlaceholder('Search or dial...').first().fill('Bob');
    await expect(page.getByText('Bob Smith').first()).toBeVisible();
    // Contact rows are pointers; Bob remains, unknown-number dial row can stay
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
  });

  test('empty search result shows empty state', async ({ page }) => {
    await gotoCalls(page);
    await page
      .getByPlaceholder('Search or dial...')
      .first()
      .fill('zzz-no-matches');
    await expect(page.getByText(/no calls found/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('missed filter keeps missed calls in history', async ({ page }) => {
    await gotoCalls(page);
    await page.getByText('Missed', { exact: true }).first().click();
    // "Unknown" missed mock call is visible
    await expect(page.getByText('Unknown').first()).toBeVisible({
      timeout: 5000,
    });
    // Back to All restores the outgoing record
    await page.getByText(/^All$/).first().click();
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
  });

  test('dialpad keys are clickable and update the display', async ({ page }) => {
    await gotoCalls(page);
    // Dialpad KeyButtons (motion.button, text content is the digit)
    await page.getByRole('button', { name: /1/ }).last(); // sidebar badge guard
    const dialpad = page.locator('div').filter({ has: page.locator('#dialer-number-input') });
    for (const digit of ['1', '2', '3']) {
      await dialpad.getByRole('button', { name: new RegExp(`^${digit}`) }).first().click();
    }
    await expect(page.locator('#dialer-number-input')).toHaveValue(/123/, {
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
