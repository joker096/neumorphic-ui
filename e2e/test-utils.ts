import { expect, type Page } from '@playwright/test';

export async function ensureAppReady(page: Page) {
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded', timeout: 90_000 });

  // Wait for the React app to actually mount. `domcontentloaded` fires on the
  // shell HTML before Vite's cold dev transform has finished serving the JS,
  // so on a cold/first run the page can be blank for several seconds.
  await page.waitForSelector('#root > *', { state: 'attached', timeout: 30000 });

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
