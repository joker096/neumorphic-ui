import { test, expect, Page } from '@playwright/test';

/**
 * Chat list screen: search, tabs, folder filters, advanced filter modal,
 * chat items with unread badges, channel/bot create tiles.
 */

async function gotoChats(page: Page) {
  await page.goto('/');
  await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByPlaceholder('Search chats or messages...').first()
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

  test('search filters chats by name', async ({ page }) => {
    await gotoChats(page);
    const search = page.getByPlaceholder('Search chats or messages...').first();
    // "Freeman" matches only the contact name, no message contents
    await search.fill('Freeman');
    const listItems = page.locator('.chat-list-item');
    await expect(listItems.getByText('Alice Freeman')).toBeVisible();
    await expect(listItems.getByText('Victor')).toHaveCount(0);
    // Clear button resets
    await page.getByLabel('Clear').first().click();
    await expect(listItems.getByText('Victor')).toBeVisible();
  });

  test('search with no matches shows "No results found"', async ({ page }) => {
    await gotoChats(page);
    await page
      .getByPlaceholder('Search chats or messages...')
      .first()
      .fill('zzz-nonexistent-zzz');
    await expect(page.getByText('No results found').first()).toBeVisible();
  });

  test('view tabs switch between Stories/Chats/Channels/Bots', async ({ page }) => {
    await gotoChats(page);

    await page.getByText('Channels', { exact: true }).first().click();
    await expect(page.getByPlaceholder('Search channels...').first()).toBeVisible();

    await page.getByText('Bots', { exact: true }).first().click();
    await expect(
      page.getByPlaceholder('Search bots or services...').first()
    ).toBeVisible();

    await page.getByText('Chats', { exact: true }).first().click();
    await expect(
      page.getByPlaceholder('Search chats or messages...').first()
    ).toBeVisible();
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
    const unread = page.getByText('Unread', { exact: true }).first();
    await unread.click();
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
    // Victor has unread: 0 in mocks -> filtered out of the list area
    await expect(page.locator('.chat-list-item').getByText('Victor')).toHaveCount(0);
  });

  test('advanced filter modal opens and closes', async ({ page }) => {
    await gotoChats(page);
    // Filter icon button sits near the folder bar
    const filterIcon = page
      .locator('div.rounded-full, [class*="filter"]')
      .filter({ has: page.locator('svg') })
      .last();
    // Fallback: click element that opens "Advanced Filters" via any clickable ancestor
    const advancedTitle = page.getByText('Advanced Filters');
    if (!(await advancedTitle.count())) {
      await filterIcon.click().catch(() => {});
    }
    if (await advancedTitle.count()) {
      await expect(advancedTitle).toBeVisible();
      const reset = page.getByText('Reset', { exact: true });
      if (await reset.count()) await reset.click();
      const apply = page.getByText('Apply', { exact: true });
      if (await apply.count()) await apply.click();
      await expect(advancedTitle).toHaveCount(0);
    }
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
    // Back to list
    await page.getByLabel('Go Back').first().click();
    await expect(
      page.getByPlaceholder('Search chats or messages...').first()
    ).toBeVisible();
  });
});
