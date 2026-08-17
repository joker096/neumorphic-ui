import { expect, type Page } from '@playwright/test';

export async function ensureAppReady(page: Page) {
  await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
}
