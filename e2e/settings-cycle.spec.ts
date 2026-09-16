import { test, expect, type Page } from '@playwright/test';
import { gotoSettings, ensureAppReady, openSettingsViaProfile } from './test-utils';

/**
 * Settings cycle: one pass through EVERY settings section/toggle/subview.
 *
 * The cycle opens each main-menu entry, verifies the section anchor and its
 * key rows render, exercises safe controls (toggles, theme, language), and
 * returns to the main menu. A final pass checks persistence across reload.
 */

type SectionDef = {
  /** Main menu item title (exact text). */
  menu: string;
  /** Text that proves the section is open. */
  anchor: string;
  /** Key rows that must be visible in the section. */
  rows?: string[];
};

const SECTIONS: SectionDef[] = [
  { menu: 'Profile & Accounts', anchor: 'Profile & Accounts' },
  { menu: 'Theme', anchor: 'Appearance', rows: ['Font size', 'UI Animations'] },
  { menu: 'Language', anchor: 'Language', rows: ['Русский', 'English'] },
  { menu: 'Notifications', anchor: 'Notifications' },
  { menu: 'Security', anchor: 'Security', rows: ['PIN Lock', 'App Lock'] },
  { menu: 'Privacy', anchor: 'Privacy', rows: ['Ghost View Mode', 'Blacklist'] },
  { menu: 'Folders', anchor: 'Folders' },
  { menu: 'Backup & Export', anchor: 'Backup & Export' },
  { menu: 'Data and Storage', anchor: 'Data and Storage', rows: ['Local encryption at rest', 'Clear cache'] },
  { menu: 'Company Chat', anchor: 'Company Chat', rows: ['Company guide'] },
  { menu: 'Bots', anchor: 'Bots' },
  { menu: 'Call settings', anchor: 'Call settings', rows: ['Record calls automatically', 'Call History'] },
  { menu: 'Mesh Radar', anchor: 'Mesh Radar' },
  { menu: 'Payments & Billing', anchor: 'Payments & Billing' },
  { menu: 'Proxy and Network', anchor: 'Proxy and Network', rows: ['Obfuscation', 'Relay Backend'] },
  { menu: 'System Status', anchor: 'System Status' },
  { menu: 'Help & Support', anchor: 'Help & Support' },
];

/** Settings live inside <main>; the sidebar (Chats/Company Chat/…) is outside it. */
const main = (page: Page) => page.getByRole('main');

async function assertMainMenu(page: Page) {
  await expect(main(page).getByPlaceholder('Search settings')).toBeVisible();
  await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
}

async function backToMainMenu(page: Page) {
  await page.getByLabel(/back|go back/i).first().click();
  await assertMainMenu(page);
}

test.describe('Settings cycle', () => {
  test('every section opens, renders key rows, and back navigation works', async ({ page }) => {
    await gotoSettings(page);

    for (const section of SECTIONS) {
      // 'Notifications' matches the group title too; the row is the last match.
      const menuItem = main(page).getByText(section.menu, { exact: true });
      // 'Notifications' matches the group title too; the menu row is the last match.
      const item = section.menu === 'Notifications' ? menuItem.last() : menuItem.first();
      await expect(item).toBeVisible();
      await item.click();

      await expect(main(page).getByText(section.anchor, { exact: true }).first()).toBeVisible({ timeout: 5000 });
      for (const row of section.rows ?? []) {
        await expect(main(page).getByText(row, { exact: true }).first()).toBeVisible();
      }
      await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);

      await backToMainMenu(page);
    }
  });

  test('main menu toggles (Notifications / Sound / Local data snapshot) flip and revert', async ({ page }) => {
    await gotoSettings(page);

    for (const name of ['Notifications', 'Sound', 'Local data snapshot']) {
      const toggle = page.getByRole('switch', { name });
      await expect(toggle).toBeVisible();
      const before = await toggle.getAttribute('aria-checked');
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');
      // revert
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', before);
    }
    await assertMainMenu(page);
  });

  test('theme toggle switches dark -> light -> dark', async ({ page }) => {
    await gotoSettings(page);
    await main(page).getByText('Theme', { exact: true }).first().click();
    await expect(main(page).getByText('Appearance', { exact: true }).first()).toBeVisible();

    const toLight = page.getByTestId('theme-mode-light');
    await expect(toLight).toBeVisible();
    await toLight.click();
    await expect(page.locator('html[data-theme]')).toHaveAttribute('data-theme', 'light');

    await page.getByTestId('theme-mode-dark').click();
    await expect(page.locator('html[data-theme]')).toHaveAttribute('data-theme', 'dark');
  });

  test('language switch to Russian and back to English', async ({ page }) => {
    await gotoSettings(page);
    await main(page).getByText('Language', { exact: true }).first().click();
    await expect(main(page).getByText('Language', { exact: true }).first()).toBeVisible();

    await main(page).getByText('Русский', { exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Чаты' }).first()).toBeVisible({ timeout: 5000 });

    // Section stays open; language names are native, so 'English' is stable.
    await page.getByText('English', { exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Chats' }).first()).toBeVisible({ timeout: 5000 });

    await backToMainMenu(page);
  });

  test('sound toggle persists across reload', async ({ page }) => {
    await gotoSettings(page);

    const sound = page.getByRole('switch', { name: 'Sound' });
    const before = await sound.getAttribute('aria-checked');
    await sound.click();
    await expect(sound).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');

    await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
    await ensureAppReady(page);
    await openSettingsViaProfile(page);

    const reloaded = page.getByRole('switch', { name: 'Sound' });
    await expect(reloaded).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');

    // revert
    await reloaded.click();
    await expect(reloaded).toHaveAttribute('aria-checked', before);
    await assertMainMenu(page);
  });
});
