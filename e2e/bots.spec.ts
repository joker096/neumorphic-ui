import { test, expect, type Page } from '@playwright/test';
import { ensureAppReady, openSettingsViaProfile, gotoSettings } from './test-utils';

/**
 * Bots: create a bot via Settings -> Bots, verify the Stopped row, persist
 * across reload (idb bots_list), toggle to Running, remove via confirm dialog.
 */

const BOT_NAME = 'E2E Bot Alpha';

/** Settings live inside <main>; the sidebar (Chats/Company Chat/…) is outside it. */
const main = (page: Page) => page.getByRole('main');

async function gotoBotsSection(page: Page) {
  await gotoSettings(page);
  await main(page).getByText('Bots', { exact: true }).first().click();
  await expect(main(page).getByText('Bots', { exact: true }).first()).toBeVisible();
}

async function createBot(page: Page) {
  await main(page).getByText('Add Bot', { exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'New Bot' });
  await expect(modal).toBeVisible();
  await modal.getByPlaceholder('e.g. My Assistant Bot').fill(BOT_NAME);
  await modal.getByRole('button', { name: 'Generate Token' }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByRole('switch', { name: BOT_NAME })).toBeVisible();
}

test.describe('Bots', () => {
  test('created bot renders as Stopped and toggles to Running', async ({ page }) => {
    await gotoBotsSection(page);
    await expect(main(page).getByText('No active bots')).toBeVisible();

    await createBot(page);

    await expect(main(page).getByText('Stopped', { exact: true })).toBeVisible();
    const toggle = page.getByRole('switch', { name: BOT_NAME });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(main(page).getByText('Running', { exact: true })).toBeVisible();
  });

  test('created bot persists across reload', async ({ page }) => {
    await gotoBotsSection(page);
    await createBot(page);
    await expect(page.getByRole('switch', { name: BOT_NAME })).toHaveAttribute('aria-checked', 'false');

    await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
    await ensureAppReady(page);
    await openSettingsViaProfile(page);
    await main(page).getByText('Bots', { exact: true }).first().click();

    // Hydration from idb bots_list is async; poll until the row resolves.
    const toggle = page.getByRole('switch', { name: BOT_NAME });
    await expect(toggle).toBeVisible({ timeout: 15_000 });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('bot can be removed via the confirm dialog', async ({ page }) => {
    await gotoBotsSection(page);
    await createBot(page);

    await page.getByRole('button', { name: 'Remove bot' }).click();
    const dialog = page.getByRole('dialog', { name: 'Are you sure you want to remove this bot?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Remove', exact: true }).click();

    await expect(dialog).toHaveCount(0);
    await expect(main(page).getByText('No active bots')).toBeVisible();
  });
});
