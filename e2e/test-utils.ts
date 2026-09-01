import { expect, type Page } from '@playwright/test';

export async function ensureAppReady(page: Page) {
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('html[data-theme]')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
}

/**
 * Settings is opened via the profile ("User") button at the bottom of the
 * desktop sidebar (EcoSidebarNav). There is no dedicated Settings nav item.
 */
export async function openSettingsViaProfile(page: Page) {
  await page.getByRole('button', { name: 'User', exact: true }).first().click();
  await expect(page.getByPlaceholder('Search settings')).toBeVisible();
}

export async function gotoSettings(page: Page) {
  await ensureAppReady(page);
  await openSettingsViaProfile(page);
}
