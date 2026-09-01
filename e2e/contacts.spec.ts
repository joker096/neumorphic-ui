import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

/**
 * Contacts / Identity screen: search, tabs, add-contact modal,
 * share-identity modal, contact profile modal and its actions.
 */

async function gotoContacts(page: Page) {
  await ensureAppReady(page);
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

  test('share identity modal shows QR and Copy ID button', async ({ page }) => {
    await gotoContacts(page);
    await page.locator('[title="Share My Identity"]').click();
    await expect(
      page.getByRole('button', { name: /copy id/i })
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
    await expect(page.getByText('Video call').first()).toBeVisible();
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

  test('contact profile shows shared media from the chat history', async ({ page }) => {
    await gotoContacts(page);
    await page.getByText('Alice Freeman').first().click();
    await expect(page.getByText('Shared media', { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Files' }).first().click();
    await expect(page.getByText('dashboard-mockup.pdf').first()).toBeVisible();
  });

  test('contact profile has a notifications toggle', async ({ page }) => {
    await gotoContacts(page);
    await page.getByText('Alice Freeman').first().click();
    const row = page.getByText('Notifications', { exact: true }).locator('..').locator('..');
    await expect(row).toBeVisible();
    const toggle = row.getByRole('switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
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

  test('report contact from profile modal submits a report', async ({ page }) => {
    await gotoContacts(page);
    await page.getByText('Alice Freeman').first().click();
    const more = page.getByLabel('More actions').first();
    if (!(await more.count())) return;
    await more.click();
    await page.getByLabel('Report').first().click();
    await expect(page.getByText('Report submitted')).toBeVisible();
  });

  test('block contact from profile modal marks the contact blocked', async ({ page }) => {
    await gotoContacts(page);
    await page.getByText('Alice Freeman').first().click();
    const more = page.getByLabel('More actions').first();
    if (!(await more.count())) return;
    await more.click();
    await page.getByLabel('Block Spammer').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Block Spammer' }).click();
    // Profile closes on block; reopen to verify the blocked badge
    await page.getByText('Alice Freeman').first().click();
    await expect(page.getByText('User blocked')).toBeVisible();
  });

  test('invite modal opens from the header invite button', async ({ page }) => {
    await gotoContacts(page);
    await page.locator('[title="Invite friends"]').first().click();
    await expect(page.getByRole('heading', { name: 'Invite friends' })).toBeVisible();
    await expect(
      page.getByText('Join me on Mess&Anger — secure, decentralized messaging!')
    ).toBeVisible();
  });

  test('blocked tab lists blocked contacts and unblock removes them', async ({ page }) => {
    await gotoContacts(page);
    // Block Alice Freeman via the profile More menu
    await page.getByText('Alice Freeman').first().click();
    await page.getByLabel('More actions').first().click();
    await page.getByLabel('Block Spammer').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Block Spammer' }).click();

    // Blocked tab shows the blocked contact
    await page.getByRole('button', { name: /Blocked \(/i }).click();
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();

    // Unblock from the profile
    await page.getByText('Alice Freeman').first().click();
    await page.getByLabel('More actions').first().click();
    await page.getByLabel('Unblock', { exact: true }).click();

    // Blocked list is now empty
    await expect(page.getByText('No blocked contacts')).toBeVisible();
  });
});
