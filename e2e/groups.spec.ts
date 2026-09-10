import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

/**
 * Group management: create a group from the chat list, open its profile,
 * verify invite link, slow mode, owner row, per-member mute/ban toggles.
 */

async function createGroup(page: Page, name: string, memberNames: string[]) {
  await ensureAppReady(page);
  await page.getByRole('button', { name: 'New Group' }).click();
  const modal = page.getByRole('dialog', { name: 'New Group' });
  await expect(modal).toBeVisible();
  await modal.getByPlaceholder('Name...').fill(name);
  for (const memberName of memberNames) {
    await modal.getByText(memberName, { exact: true }).click();
  }
  await modal.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.locator('.chat-list-item').getByText(name)).toBeVisible();
}

test.describe('Group management', () => {
  test('created group appears in chat list', async ({ page }) => {
    await createGroup(page, 'E2E Group A', ['Alice Freeman', 'Bob Smith']);
    await expect(page.locator('.chat-list-item').getByText('E2E Group A')).toBeVisible();
  });

  test('group profile shows invite link, slow mode and owner row', async ({ page }) => {
    await createGroup(page, 'E2E Group B', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group B').click();
    await page.getByLabel('E2E Group B Profile').click();

    // Invite link card
    await expect(page.getByText('Invite link')).toBeVisible();
    await expect(page.getByText(/ma\.to\//)).toBeVisible();

    // Slow mode control
    await expect(page.getByLabel('Slow mode')).toBeVisible();

    // First selected member is owner (last match: member badge, after the info-row label)
    await expect(page.getByText('Owner', { exact: true }).last()).toBeVisible();
    // Second member has role select and mute/ban toggles
    await expect(page.getByLabel('Bob Smith Role')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bob Smith Ban' })).toBeVisible();
  });

  test('ban toggle updates aria-pressed on member row', async ({ page }) => {
    await createGroup(page, 'E2E Group C', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group C').click();
    await page.getByLabel('E2E Group C Profile').click();

    const banToggle = page.getByRole('button', { name: 'Bob Smith Ban' });
    await expect(banToggle).toHaveAttribute('aria-pressed', 'false');
    await banToggle.click();
    await expect(banToggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('owner can delete the group from the profile', async ({ page }) => {
    await createGroup(page, 'E2E Group E', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group E').click();
    await page.getByLabel('E2E Group E Profile').click();

    await page.getByRole('button', { name: 'Delete group' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete group?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.chat-list-item').getByText('E2E Group E')).toHaveCount(0);
  });

  test('owner leaving the group dissolves it', async ({ page }) => {
    await createGroup(page, 'E2E Group F', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group F').click();
    await page.getByLabel('E2E Group F Profile').click();

    await page.getByRole('button', { name: 'Leave', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Leave group?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Leave', exact: true }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.chat-list-item').getByText('E2E Group F')).toHaveCount(0);
  });

  test('pin a message and unpin it from the group profile', async ({ page }) => {
    await createGroup(page, 'E2E Group G', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group G').click();

    const input = page.getByPlaceholder('Message...').first();
    await input.fill('Pin me');
    await page.getByLabel('Send Message').first().click();

    // Context menu on the bubble -> Pin (hover overlay blocks real right-click, dispatch directly)
    await page.locator('span.pb-1', { hasText: 'Pin me' }).dispatchEvent('contextmenu');
    await page.getByRole('button', { name: 'Pin', exact: true }).click();

    // Pinned bar appears in the chat
    await expect(page.getByRole('button', { name: 'Pinned messages' })).toBeVisible();

    // Group profile shows the pinned row with an Unpin control
    await page.getByLabel('E2E Group G Profile').click();
    await expect(page.getByRole('button', { name: 'Unpin' })).toBeVisible();
    await page.getByRole('button', { name: 'Unpin' }).click();

    // Unpinned: profile shows empty state, bar disappears in the chat
    await expect(page.getByText('No pinned messages')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pinned messages' })).toHaveCount(0);
  });

  test('owner toggles group permission switches', async ({ page }) => {
    await createGroup(page, 'E2E Group H', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group H').click();
    await page.getByLabel('E2E Group H Profile').click();

    const addMembers = page.getByRole('switch', { name: 'Add members' });
    await expect(addMembers).toHaveAttribute('aria-checked', 'false');
    await addMembers.click();
    await expect(addMembers).toHaveAttribute('aria-checked', 'true');
  });

  test('shared media tab shows image and link from group history', async ({ page }) => {
    await createGroup(page, 'E2E Group I', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group I').click();

    const input = page.getByPlaceholder('Message...').first();
    await input.fill('Look https://example.com');
    await page.getByLabel('Send Message').first().click();

    // Attach a 1x1 PNG via the hidden file input
    const tinyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFc83AAAAJklEQVQYpWOQkHb8L2BoKChhWAFQAABZ5QiAeJqyCAAAAABJRU5ErkJggg==',
      'base64',
    );
    await page.getByLabel('Attach file').setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: tinyPng });
    await expect(page.locator('span.pb-1', { hasText: 'Look https://example.com' })).toBeVisible();

    // Group profile: shared media section reflects the history
    await page.getByLabel('E2E Group I Profile').click();
    await expect(page.getByText('Shared media')).toBeVisible();
    await expect(page.getByAltText('Media')).toBeVisible();

    // Links tab lists the URL
    await page.getByRole('button', { name: 'Links', exact: true }).click();
    await expect(page.locator('span').filter({ hasText: /^https:\/\/example\.com$/ })).toBeVisible();
  });

  test('group profile shows group info (owner, created, description)', async ({ page }) => {
    await createGroup(page, 'E2E Group J', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group J').click();
    await page.getByLabel('E2E Group J Profile').click();

    await expect(page.getByText('Group info')).toBeVisible();
    await expect(page.getByText('Created', { exact: true })).toBeVisible();
    await expect(page.getByText('No description')).toBeVisible();
    await expect(page.getByLabel('Main content').getByText('You', { exact: true })).toBeVisible();
  });

  test('group mute toggle is store-backed and persists across profile reopens', async ({ page }) => {
    await createGroup(page, 'E2E Group K', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group K').click();
    await page.getByLabel('E2E Group K Profile').click();

    const muteToggle = page.getByRole('switch', { name: 'Mute' });
    await expect(muteToggle).toHaveAttribute('aria-checked', 'false');
    await muteToggle.click();
    await expect(muteToggle).toHaveAttribute('aria-checked', 'true');

    // Close + reopen the profile: state lives in the store, not component state
    await page.getByRole('button', { name: 'Close', exact: true }).last().click();
    await expect(page.getByText('Group info')).toHaveCount(0);
    await page.locator('.chat-list-item').getByText('E2E Group K').click();
    await page.getByLabel('E2E Group K Profile').click();
    await expect(page.getByRole('switch', { name: 'Mute' })).toHaveAttribute('aria-checked', 'true');
  });

  test('remove member from group', async ({ page }) => {
    await createGroup(page, 'E2E Group D', ['Alice Freeman', 'Bob Smith']);
    await page.locator('.chat-list-item').getByText('E2E Group D').click();
    await page.getByLabel('E2E Group D Profile').click();

    await page.getByRole('button', { name: 'Bob Smith Remove' }).click();
    await expect(page.getByLabel('Bob Smith Role')).toHaveCount(0);
    // Remaining contacts offered for adding
    await expect(page.getByRole('button', { name: 'Add member Bob Smith' })).toBeVisible();
  });
});
