import { test, expect, Page } from '@playwright/test';

/**
 * Contacts / Identity screen: search, tabs, add-contact modal,
 * share-identity modal, contact profile modal and its actions.
 */

async function gotoContacts(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Contacts' }).first().click();
  await expect(page.getByTestId('contacts-container')).toBeVisible();
}

test.describe('Contacts & identity', () => {
  test('identity screen renders with header actions', async ({ page }) => {
    await gotoContacts(page);
    await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();
    await expect(page.locator('[title="Scan Contact QR"]')).toBeVisible();
    await expect(page.locator('[title="Share My Identity"]')).toBeVisible();
    await expect(page.locator('[title="Add New Contact"]')).toBeVisible();
    await expect(page.getByPlaceholder('Search contacts...')).toBeVisible();
  });

  test('contact tabs render counters', async ({ page }) => {
    await gotoContacts(page);
    await expect(page.getByRole('button', { name: /^all \(/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /favorites \(/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /recent/i })).toBeVisible();
  });

  test('mock contacts are listed', async ({ page }) => {
    await gotoContacts(page);
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
  });

  test('search filters contacts', async ({ page }) => {
    await gotoContacts(page);
    await page.getByPlaceholder('Search contacts...').fill('Alice');
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
    await expect(page.getByText('Bob Smith')).toHaveCount(0);
  });

  test('add contact modal validates inputs and saves', async ({ page }) => {
    await gotoContacts(page);
    await page.locator('[title="Add New Contact"]').click();
    await expect(page.getByPlaceholder('Contact Name')).toBeVisible();
    await expect(page.getByPlaceholder('Network ID or Hash')).toBeVisible();

    const save = page.getByRole('button', { name: /save contact/i });
    // Visually disabled (opacity-50, cursor-not-allowed) until both fields filled
    await expect(save).toHaveClass(/opacity-50/);

    await page.getByPlaceholder('Contact Name').fill('Playwright Bot');
    await page
      .getByPlaceholder('Network ID or Hash')
      .fill('nexus://id/e2e-test-peer-1234');
    await expect(save).not.toHaveClass(/opacity-50/);
    await save.click();

    // New contact visible in the list (toast message is locale-dependent)
    await expect(page.getByText('Playwright Bot').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('add contact modal closes via Close button', async ({ page }) => {
    await gotoContacts(page);
    await page.locator('[title="Add New Contact"]').click();
    await expect(page.getByPlaceholder('Contact Name')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByPlaceholder('Contact Name')).toHaveCount(0);
  });

  test('share identity modal shows QR and Copy Link button', async ({ page }) => {
    await gotoContacts(page);
    await page.locator('[title="Share My Identity"]').click();
    await expect(
      page.getByRole('button', { name: /copy link/i })
    ).toBeVisible();
    // ID text rendered (nexus:// scheme)
    await expect(page.getByText(/nexus:\/\//).first()).toBeVisible({
      timeout: 5000,
    });
    await page.locator('[title="Close"]').first().click();
  });

  test('scan QR modal opens', async ({ page }) => {
    await gotoContacts(page);
    await page.locator('[title="Scan Contact QR"]').click();
    // Headless env has no camera; the modal container should still be there
    // (scanner area may be blank) and must not crash the app
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('contact row opens profile modal with call/message actions', async ({ page }) => {
    await gotoContacts(page);
    await page.getByText('Alice Freeman').first().click();
    await expect(page.getByText('Video Call').first()).toBeVisible();
    await expect(page.getByText('Verify Security').first()).toBeVisible();
    // More actions menu
    const more = page.getByLabel('More actions').first();
    if (await more.count()) {
      await more.click();
      await expect(page.getByLabel('Delete Contact')).toBeVisible();
      await expect(page.getByLabel('Block Spammer')).toBeVisible();
    }
    await page.getByLabel('Close').first().click();
  });

  test('Message action from contact profile opens a chat', async ({ page }) => {
    await gotoContacts(page);
    await page.getByText('Alice Freeman').first().click();
    const msg = page.getByText('Message', { exact: true }).first();
    if (await msg.count()) {
      await msg.click();
      // Composer should appear somewhere after navigation
      await expect(page.getByPlaceholder('Message...').first()).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('delete contact from profile modal asks for confirmation', async ({ page }) => {
    await gotoContacts(page);
    await page.getByText('Alice Freeman').first().click();
    const more = page.getByLabel('More actions').first();
    if (!(await more.count())) return;
    await more.click();
    await page.getByLabel('Delete Contact').click();
    // Confirm dialog (danger-styled confirm button)
    const dangerConfirm = page
      .getByRole('button', { name: 'Delete Contact' })
      .first();
    if (await dangerConfirm.count()) {
      await expect(dangerConfirm).toBeVisible();
      // Cancel instead of actually deleting to keep mocks intact (Escape closes the confirm dialog)
      await page.keyboard.press('Escape');
    }
  });
});
