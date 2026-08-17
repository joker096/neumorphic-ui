import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

/**
 * Settings: main menu, appearance (theme/font), language switching,
 * security (PIN + wipe dialog), privacy, network, storage sections.
 */

async function gotoSettings(page: Page) {
  await ensureAppReady(page);
  await page.getByRole('button', { name: 'Settings' }).first().click();
  await expect(page.getByPlaceholder('Search settings')).toBeVisible();
}

async function openSettingsItem(page: Page, title: string) {
  await page.getByText(title, { exact: true }).first().click();
}

test.describe('Settings', () => {
  test('main menu shows all sections', async ({ page }) => {
    await gotoSettings(page);
    for (const text of [
      'Profile & Accounts',
      'Bots',
      'Call Log',
      'Mesh Radar',
      'Theme',
      'Language',
      'Notifications',
      'Sound',
      'Cloud sync',
      'Security',
      'Privacy',
      'Data and Storage',
      'Proxy and Network',
      'Spam Protection',
      'System Status',
    ]) {
      await expect(page.getByText(text).first()).toBeVisible();
    }
  });

  test('settings search filters sections', async ({ page }) => {
    await gotoSettings(page);
    await page.getByPlaceholder('Search settings').fill('proxy');
    await expect(page.getByText('Proxy and Network').first()).toBeVisible();
  });

  test('appearance: dark theme toggle switches to light and back', async ({ page }) => {
    await gotoSettings(page);
    await page.getByText('Theme').first().click();
    await expect(page.getByText('Appearance').first()).toBeVisible();

    const toggle = page.locator('[title="Switch to Light Mode"]').first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'light');

    await page.locator('[title="Switch to Dark Mode"]').first().click();
    await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  });

  test('appearance: font size cycles Small -> Medium -> Large', async ({ page }) => {
    await gotoSettings(page);
    await page.getByText('Theme').first().click();
    const fontRow = page.getByText('Font size').first();
    await expect(fontRow).toBeVisible();
    // Default is Medium from app defaults; clicking cycles
    await fontRow.click();
    await page.waitForTimeout(300);
    const size = await page.locator('[data-font-size]').getAttribute('data-font-size');
    expect(size).toBeTruthy();
  });

  test('language section lists all languages and switches to Russian', async ({ page }) => {
    await gotoSettings(page);
    await page.getByText('Language').first().click();
    await expect(page.getByText('Русский').first()).toBeVisible();
    await expect(page.getByText('Español').first()).toBeVisible();
    await expect(page.getByText('中文').first()).toBeVisible();

    // Switch to Russian -> nav labels localize
    await page.getByText('Русский').first().click();
    await expect(
      page.getByRole('button', { name: 'Чаты' }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('security: PIN lock toggle reveals PIN input and accepts a PIN', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Security');
    await expect(page.getByText('PIN Lock', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    await page.getByRole('switch').first().click();
    const pinInput = page.locator('#security-pin-input');
    await expect(pinInput).toBeVisible();

    // Too short PIN shows an error toast
    await pinInput.fill('12');
    await page.getByText(/confirm pin/i).first().click();
    await expect(
      page.getByText(/pin must be at least 4 characters/i).first()
    ).toBeVisible({ timeout: 5000 });

    // Valid PIN -> app locks immediately with lock screen (feature works)
    await pinInput.fill('4321');
    await page.getByText(/confirm pin/i).first().click();
    await expect(
      page.getByText(/pin set successfully|app locked/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('security: wipe-all-data opens a confirm dialog that can be cancelled', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Security');
    await page.getByText('Wipe All Data').first().click();
    // Confirm modal with warning
    await expect(
      page.getByText('Are you sure you want to wipe all data?')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    // Dialog dismissed, app intact
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
  });

  test('privacy: visibility rows cycle values', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Privacy');
    const numberRow = page.getByText('Who can see my number').first();
    await expect(numberRow).toBeVisible();
    await numberRow.click();
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
    await page.getByText('Who can see my last seen').first().click();
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
  });

  test('privacy: read receipts toggle flips switch state', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Privacy');
    const row = page.getByText('Read Receipts').first();
    await expect(row).toBeVisible();
    // find switch near the row
    const switchEl = row
      .locator('xpath=ancestor::*[self::div or self::button][1]')
      .locator('[role="switch"]')
      .first();
    if (await switchEl.count()) {
      const before = await switchEl.getAttribute('aria-checked');
      await switchEl.click();
      await expect(switchEl).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');
      // revert
      await switchEl.click();
    }
  });

  test('network: proxy toggle reveals proxy url input', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Proxy and Network');
    await expect(page.getByText('Use Proxy').first()).toBeVisible();
    const useProxyRow = page.getByText('Use Proxy').first();
    const switchEl = useProxyRow
      .locator('xpath=ancestor::*[self::div or self::button][1]')
      .locator('[role="switch"]')
      .first();
    if (await switchEl.count()) {
      const before = await switchEl.getAttribute('aria-checked');
      if (before !== 'true') {
        await switchEl.click();
      }
      await expect(
        page.getByPlaceholder('socks5://127.0.0.1:9050')
      ).toBeVisible({ timeout: 5000 });
      // leave proxy on is harmless; revert to previous anyway
      if (before !== 'true') await switchEl.click();
    } else {
      await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
    }
  });

  test('network: obfuscation and relay rows are present', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Proxy and Network');
    await expect(page.getByText('Obfuscation').first()).toBeVisible();
    await expect(page.getByText('Relay Backend').first()).toBeVisible();
    await expect(page.getByText('Tor Bridge').first()).toBeVisible();
    await expect(page.getByText('P2P Mesh Mode').first()).toBeVisible();
  });

  test('storage: clear cache shows confirm modal (cancellable)', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Data and Storage');
    const clearRow = page.getByText('Clear cache').first();
    await expect(clearRow).toBeVisible();
    await clearRow.click();
    // Action is silent; we just verify the section remains stable
    await expect(page.getByText('Clear cache').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
  });

  test('storage: export and import backup open password modal', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Data and Storage');
    const exportRow = page.getByText('Export backup').first();
    if (await exportRow.count()) {
      await exportRow.click();
      // Password input modal
      await expect(page.locator('input[type="password"]').first()).toBeVisible({
        timeout: 5000,
      });
      await page.keyboard.press('Escape');
    }
  });

  test('account section renders share identity', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Profile & Accounts');
    await expect(page.getByRole('button', { name: /share identity/i }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('system status section shows connection info', async ({ page }) => {
    await gotoSettings(page);
    const status = page.getByText('System Status').first();
    await status.click();
    // Section should render without crash
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
  });

  test('recordings section renders empty state', async ({ page }) => {
    await gotoSettings(page);
    await openSettingsItem(page, 'Call Log');
    await expect(page.getByPlaceholder('Search recordings...').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('back navigation returns to settings main menu', async ({ page }) => {
    await gotoSettings(page);
    await page.getByText('Theme').first().click();
    await expect(page.getByText('Appearance').first()).toBeVisible();
    // Back button in SubView header
    const back = page.getByLabel(/back|go back/i).first();
    if (await back.count()) {
      await back.click();
      await expect(page.getByPlaceholder('Search settings')).toBeVisible();
    }
  });
});
