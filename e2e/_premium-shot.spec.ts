import { test } from '@playwright/test';

test('visual check', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3500);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/premium-dark.png' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/premium-light.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/premium-mobile-dark.png' });
});
