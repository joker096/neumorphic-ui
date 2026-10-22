/**
 * CRM Screenshots for SEO article.
 * Run: npx playwright test e2e/crm-screenshots.spec.ts
 * Refresh the committed images:
 *   UPDATE_SEO_SCREENSHOTS=1 npx playwright test e2e/crm-screenshots.spec.ts
 *
 * Dev server runs via playwright.config.ts webServer (VITE_USE_MOCK=true).
 * Premium is seeded via localStorage entitlement cache so all 4 CRM tabs render.
 *
 * Routine e2e runs write the captures to test-results/ so the committed
 * documentation images never churn; only the explicit refresh above replaces
 * them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

const SHOT_DIR = 'docs/seo/screenshots';
/** Only an explicit refresh may replace the committed documentation images. */
const REFRESH = process.env.UPDATE_SEO_SCREENSHOTS === '1';
const OUT_DIR = REFRESH ? SHOT_DIR : path.join('test-results', 'seo-screenshots');

/**
 * Fixed placeholder for the company invite code.
 *
 * The CRM issues a random 8-character code per browser and renders it (plus a
 * QR of the deep link) inside the invite dialog, so the screenshot changed on
 * every run. The code is device-local — it only resolves against the invite
 * table of the browser that generated it — so a seeded placeholder can never
 * grant access to a real company.
 */
const FIXED_INVITE_CODE = 'SEED2425';

async function seedPremium(page: Page) {
  await page.addInitScript(
    ({ inviteCode }) => {
      localStorage.setItem(
        'premium-entitlement-cache',
        JSON.stringify({ premium: true, plan: 'premium', expiresAt: Date.now() + 90 * 24 * 3600 * 1000 }),
      );
      localStorage.setItem('neumorphic.crm.invite', inviteCode);
    },
    { inviteCode: FIXED_INVITE_CODE },
  );
}

async function gotoCrm(page: Page) {
  await seedPremium(page);
  await ensureAppReady(page);
  await page.getByRole('button', { name: /company/i }).first().click();
  await expect(page.getByPlaceholder('Search people, deals, tasks…').first()).toBeVisible({ timeout: 10_000 });
}

async function shot(page: Page, name: string) {
  await page.waitForTimeout(500);
  // `animations: disabled` fast-forwards CSS animations/transitions and
  // `caret: hide` drops the blinking text caret, so two runs of the same view
  // produce the very same pixels.
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const p = await page.screenshot({
    path: path.join(OUT_DIR, `${name}.png`),
    animations: 'disabled',
    caret: 'hide',
  });
  expect(p.length).toBeGreaterThan(1000);
}

test.describe('CRM Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // The app already honours `prefers-reduced-motion: reduce` (see
    // src/index.css and AnimationContext), so emulating it renders every
    // screen in its settled state — the captures stay identical between runs
    // instead of catching a half-finished animation.
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

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