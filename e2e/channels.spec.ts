import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

/**
 * Channels: tab lists channel rows, channel header shows subscriber count
 * (not online/offline, no call buttons), channel profile shows handle,
 * public badge, description and administrators.
 */

async function openChannelsTab(page: Page) {
  await ensureAppReady(page);
  await page.getByText('Channels', { exact: true }).first().click();
}

test.describe('Channels', () => {
  test('channels tab lists channel rows', async ({ page }) => {
    await openChannelsTab(page);
    await expect(page.locator('.chat-list-item').getByText('Tech Insights', { exact: true })).toBeVisible();
    await expect(page.locator('.chat-list-item').getByText('Design Drops', { exact: true })).toBeVisible();
  });

  test('channel header shows subscriber count instead of online status', async ({ page }) => {
    await openChannelsTab(page);
    await page.locator('.chat-list-item').getByText('Tech Insights', { exact: true }).click();

    await expect(page.getByText('1248 subscribers', { exact: true })).toBeVisible();
    // No call/video buttons for channels
    await expect(page.getByRole('button', { name: 'Start Audio Call' })).toHaveCount(0);
  });

  test('channel profile shows handle, public badge, description and admins', async ({ page }) => {
    await openChannelsTab(page);
    await page.locator('.chat-list-item').getByText('Tech Insights', { exact: true }).click();
    await page.getByLabel('Tech Insights Profile').click();

    await expect(page.getByText('@techinsights')).toBeVisible();
    await expect(page.getByText('Public channel', { exact: true })).toBeVisible();
    await expect(page.getByText('Daily updates on neural engines, vector embeddings and AI tooling.')).toBeVisible();
    await expect(page.getByText('Administrators', { exact: true })).toBeVisible();
    await expect(page.getByText('Owner', { exact: true }).first()).toBeVisible();
  });

  test('second channel shows its own subscriber count', async ({ page }) => {
    await openChannelsTab(page);
    await page.locator('.chat-list-item').getByText('Design Drops', { exact: true }).click();

    await expect(page.getByText('342 subscribers', { exact: true })).toBeVisible();
  });
});
