/**
 * CRM Screenshots for SEO article.
 * Run: npx playwright test e2e/crm-screenshots.spec.ts
 * Dev server runs via playwright.config.ts webServer (VITE_USE_MOCK=true).
 * Premium is seeded via localStorage entitlement cache so all 4 CRM tabs render.
 */
import { test, expect, type Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

const SHOT_DIR = 'docs/seo/screenshots';

async function seedPremium(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'premium-entitlement-cache',
      JSON.stringify({ premium: true, plan: 'premium', expiresAt: Date.now() + 90 * 24 * 3600 * 1000 }),
    );
  });
}

async function gotoCrm(page: Page) {
  await seedPremium(page);
  await ensureAppReady(page);
  await page.getByRole('button', { name: /company/i }).first().click();
  await expect(page.getByPlaceholder('Search people, deals, tasks…').first()).toBeVisible({ timeout: 10_000 });
}

async function shot(page: Page, name: string) {
  await page.waitForTimeout(500);
  const p = await page.screenshot({ path: `${SHOT_DIR}/${name}.png` });
  expect(p.length).toBeGreaterThan(1000);
}

test.describe('CRM Screenshots', () => {
  test('13-crm-overview', async ({ page }) => {
    await gotoCrm(page);
    await shot(page, '13-crm-overview');
  });

  test('14-crm-people', async ({ page }) => {
    await gotoCrm(page);
    await shot(page, '14-crm-people');
  });

  test('15-crm-deals', async ({ page }) => {
    await gotoCrm(page);
    await page.getByRole('button', { name: 'Deals' }).first().click();
    await shot(page, '15-crm-deals');
  });

  test('16-crm-tasks', async ({ page }) => {
    await gotoCrm(page);
    await page.getByRole('button', { name: 'Tasks' }).first().click();
    await shot(page, '16-crm-tasks');
  });

  test('17-crm-roles', async ({ page }) => {
    await gotoCrm(page);
    await page.getByRole('button', { name: 'Roles' }).first().click();
    await shot(page, '17-crm-roles');
  });

  test('18-crm-contact-card', async ({ page }) => {
    await gotoCrm(page);
    const row = page.locator('button[id^="crm-contact-"]').first();
    await row.waitFor({ state: 'visible', timeout: 10_000 });
    await row.scrollIntoViewIfNeeded();
    await row.click();
    await page.waitForTimeout(700);
    await shot(page, '18-crm-contact-card');
  });

  test('19-crm-filters', async ({ page }) => {
    await gotoCrm(page);
    const filter = page.locator('button[aria-label="Filters"]').first();
    await filter.waitFor({ state: 'visible', timeout: 10_000 });
    await filter.click();
    await page.waitForTimeout(700);
    await shot(page, '19-crm-filters');
  });

  test('20-crm-global-search', async ({ page }) => {
    await gotoCrm(page);
    const search = page.getByPlaceholder('Search people, deals, tasks…').first();
    await search.click();
    await page.keyboard.type('Å');
    await page.waitForTimeout(700);
    await shot(page, '20-crm-global-search');
  });

  test('21-crm-deal-detail', async ({ page }) => {
    await gotoCrm(page);
    await page.getByRole('button', { name: 'Deals' }).first().click();
    const deal = page.locator('[id^="crm-deal-"]').first();
    await deal.waitFor({ state: 'visible', timeout: 10_000 });
    await deal.click();
    await page.waitForTimeout(700);
    await shot(page, '21-crm-deal-detail');
  });

  test('22-crm-import', async ({ page }) => {
    await gotoCrm(page);
    const imp = page.locator('button[aria-label="Import CRM data"]').first();
    await imp.waitFor({ state: 'visible', timeout: 10_000 });
    await imp.click();
    await page.waitForTimeout(900);
    await shot(page, '22-crm-import');
  });

  test('23-crm-invite', async ({ page }) => {
    await gotoCrm(page);
    const invite = page.locator('button[aria-label="Invite"]').first();
    await invite.waitFor({ state: 'visible', timeout: 10_000 });
    await invite.click();
    await page.waitForTimeout(900);
    await shot(page, '23-crm-invite');
  });
});