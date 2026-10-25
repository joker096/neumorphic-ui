import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

/**
 * Chat list screen: search, tabs, folder filters, advanced filter modal,
 * chat items with unread badges, channel/bot create tiles.
 */

async function gotoChats(page: Page) {
  await ensureAppReady(page);
  await expect(
    page.getByRole('button', { name: 'Search' }).first()
  ).toBeVisible();
}

test.describe('Chat list', () => {
  test('mock chats render with names and unread badges', async ({ page }) => {
    await gotoChats(page);
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
    await expect(page.getByText('Design Team').first()).toBeVisible();
    await expect(page.getByText('Victor').first()).toBeVisible();
    // Unread badge "2" on Alice Freeman
    await expect(page.getByText('2').first()).toBeVisible();
  });

  test('global search finds a chat by name', async ({ page }) => {
    await gotoChats(page);
    await page.getByRole('button', { name: 'Search' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const input = dialog.getByPlaceholder('Search chats, messages, contacts…');
    // "Freeman" matches only the contact name, no message contents
    await input.fill('Freeman');
    await expect(dialog.getByText('Alice Freeman').first()).toBeVisible();
    await expect(dialog.getByText('Victor')).toHaveCount(0);
    // Clear button resets
    await dialog.getByLabel('Clear').first().click();
    await expect(dialog.getByText('Search across all chats, channels and contacts')).toBeVisible();
  });

  test('global search with no matches shows "Nothing found"', async ({ page }) => {
    await gotoChats(page);
    await page.getByRole('button', { name: 'Search' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await dialog.getByPlaceholder('Search chats, messages, contacts…').fill('zzz-nonexistent-zzz');
    await expect(dialog.getByText('Nothing found').first()).toBeVisible();
  });

  test('view tabs switch between Stories/Chats/Channels/Bots', async ({ page }) => {
    await gotoChats(page);

    await page.getByText('Channels', { exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Create Channel' })).toBeVisible();

    await page.getByText('Bots', { exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Create Bot' })).toBeVisible();

    await page.getByText('Chats', { exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Search' }).first()).toBeVisible();
  });

  test('folder filter pills are clickable', async ({ page }) => {
    await gotoChats(page);
    for (const pill of ['All', 'Personal', 'Unread', 'Work', 'Archived']) {
      const el = page.getByText(pill, { exact: true }).first();
      if (await el.count()) {
        await el.click();
        await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
      }
    }
  });

  test('"Unread" folder filter keeps only unread chats', async ({ page }) => {
    await gotoChats(page);
    // The tab shows an unread counter, so match the accessible name by prefix
    // (label alone, or "Unread (N)" when the folder has unread chats).
    const unread = page.getByRole('button', { name: /^Unread/ }).first();
    await unread.click();
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
    // Victor has unread: 0 in mocks -> filtered out of the list area
    await expect(page.locator('.chat-list-item').getByText('Victor')).toHaveCount(0);
  });

  test('advanced filter modal opens and closes', async ({ page }) => {
    await gotoChats(page);
    const advancedTitle = page.getByText('Advanced Filters');
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expect(advancedTitle).toBeVisible();
    await page.getByText('Reset', { exact: true }).click();
    await page.getByText('Apply', { exact: true }).click();
    await expect(advancedTitle).toHaveCount(0);
  });

  test('channels tab shows create-channel tile', async ({ page }) => {
    await gotoChats(page);
    await page.getByText('Channels', { exact: true }).first().click();
    const createTile = page.locator('[title="Create Channel"]');
    await expect(createTile.first()).toBeVisible();
    await createTile.first().click();
    // Create channel modal
    await expect(page.getByText('Channel Name').first()).toBeVisible({ timeout: 5000 });
    // Close modal
    await page.keyboard.press('Escape');
  });

  test('bots tab shows create-bot tile', async ({ page }) => {
    await gotoChats(page);
    await page.getByText('Bots', { exact: true }).first().click();
    const createTile = page.locator('[title="Create Bot"]');
    await expect(createTile.first()).toBeVisible();
    await createTile.first().click();
    await expect(page.getByText(/new bot/i).first()).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('archived shortcut exists', async ({ page }) => {
    await gotoChats(page);
    await expect(page.locator('[title="Archived"]').first()).toBeVisible();
  });

  test('opening a chat from list shows conversation and back button', async ({ page }) => {
    await gotoChats(page);
    await page.getByText('Alice Freeman').first().click();
    // Chat header with back button and in-chat search
    await expect(page.getByLabel('Go Back').first()).toBeVisible();
    await expect(page.getByLabel('Search Messages').first()).toBeVisible();
    // Composer present
    await expect(page.getByPlaceholder('Message...').first()).toBeVisible();
    // Back to list — single global search entry
    await page.getByLabel('Go Back').first().click();
    await expect(page.getByRole('button', { name: 'Search' }).first()).toBeVisible();
  });
});
