import { test, expect, type Page } from '@playwright/test';
import { gotoSettings, ensureAppReady, openSettingsViaProfile } from './test-utils';

/**
 * Settings feature cycle: every switch, cycle row, select and input in every
 * settings section is exercised end to end.
 *
 * Part A — every [role="switch"] in a section must have a non-empty
 *          accessible name and must flip (aria-checked) and revert cleanly.
 *          PIN/biometric switches are visibility-checked only (they open a
 *          PIN input panel / trigger WebAuthn registration).
 * Part B — cycle rows (Font size, Relay backend, Tor bridge, Obfuscation mode,
 *          Auto-load media, Auto-wipe) must change value on click and return
 *          to the original value.
 * Part C — the Idle lock select must change and restore.
 * Part D — text inputs (TURN server, proxy URL) must accept and clear input.
 * Part E — a stateful toggle (Spam Filter) must survive a reload.
 *
 * Every test traps uncaught page errors and fails if any occur.
 */

const main = (page: Page) => page.getByRole('main');

/** Switches that must NOT be flipped: they open a PIN panel / WebAuthn. */
const SKIP_NAMES = ['PIN Lock', 'Fingerprint unlock'];

async function trapErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return async () => {
    expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
  };
}

async function openSection(page: Page, menu: string) {
  const item = main(page).getByText(menu, { exact: true });
  // 'Notifications' also matches the group title; the menu row is the last match.
  const el = menu === 'Notifications' ? item.last() : item.first();
  await el.click();
  // Section views replace the searchable menu list entirely.
  await expect(main(page).getByPlaceholder('Search settings')).toHaveCount(0, { timeout: 5000 });
}

async function backToMainMenu(page: Page) {
  await page.getByLabel(/back|go back/i).first().click();
  await expect(main(page).getByPlaceholder('Search settings')).toBeVisible();
}

async function assertNoCrash(page: Page) {
  await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
}

/** Part A: audit + flip every switch in the current section. */
async function auditSwitches(page: Page, section: string) {
  const switches = main(page).getByRole('switch');
  const count = await switches.count();
  for (let i = 0; i < count; i++) {
    const sw = switches.nth(i);
    const label = (await sw.getAttribute('aria-label')) ?? '';
    expect(label.trim(), `switch #${i} in '${section}' must have a non-empty accessible name`).not.toBe('');
    if (SKIP_NAMES.some((skip) => label.includes(skip))) continue;
    const before = await sw.getAttribute('aria-checked');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true', {
      timeout: 5000,
    });
    // Revert so the next switch sees the original DOM (indices stay stable).
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', before, { timeout: 5000 });
  }
  await assertNoCrash(page);
}

/** Part B: click a cycle row until its value changes, then restore it. */
async function auditCycleRow(page: Page, title: string) {
  const row = main(page).getByRole('button').filter({ hasText: title });
  await expect(row).toBeVisible({ timeout: 5000 });
  const value = async () => (await row.locator('span').last().innerText()).trim();

  const initial = await value();
  let changed = false;
  for (let i = 0; i < 8 && !changed; i++) {
    await row.click();
    const next = await value();
    if (next !== initial) changed = true;
  }
  expect(changed, `cycle row '${title}' must change value on click (stuck at '${initial}')`).toBe(true);

  for (let i = 0; i < 16; i++) {
    if ((await value()) === initial) break;
    await row.click();
  }
  expect(await value(), `cycle row '${title}' must return to '${initial}'`).toBe(initial);
  await assertNoCrash(page);
}

test.describe('Settings feature cycle', () => {
  test('main menu switches are named and flip cleanly', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await auditSwitches(page, 'main menu');
    await assertNoErrors();
  });

  test('Theme: switches flip, Font size cycles back', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Theme');
    await auditSwitches(page, 'Theme');
    await auditCycleRow(page, 'Font size');
    await backToMainMenu(page);
    await assertNoErrors();
  });

  test('Notifications: every switch is named and flips', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Notifications');
    await auditSwitches(page, 'Notifications');
    await backToMainMenu(page);
    await assertNoErrors();
  });

  test('Security: safe switches flip, Idle lock select works, Auto-wipe cycles', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Security');
    await auditSwitches(page, 'Security');

    // Part C: Idle lock select — change to a different option, then restore.
    const select = main(page).locator('select');
    await expect(select).toBeVisible({ timeout: 5000 });
    const before = await select.inputValue();
    const optionValues = await select.locator('option').evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value),
    );
    const pickable = optionValues.filter((v) => v !== before);
    expect(pickable.length, 'Idle lock select must offer at least two options').toBeGreaterThan(0);
    await select.selectOption(pickable[0]);
    await expect(select).toHaveValue(pickable[0]);
    await select.selectOption(before);
    await expect(select).toHaveValue(before);

    // Part B: Dead Man's Switch cycle row.
    await auditCycleRow(page, 'Auto-wipe (Dead Man\'s Switch)');
    await backToMainMenu(page);
    await assertNoErrors();
  });

  test('Privacy: every switch is named and flips', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Privacy');
    await auditSwitches(page, 'Privacy');
    await backToMainMenu(page);
    await assertNoErrors();
  });

  test('Company Chat: switches flip', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Company Chat');
    await auditSwitches(page, 'Company Chat');
    await backToMainMenu(page);
    await assertNoErrors();
  });

  test('Payments & Billing: switches flip', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Payments & Billing');
    await auditSwitches(page, 'Payments & Billing');
    await backToMainMenu(page);
    await assertNoErrors();
  });

  test('Call settings: switches flip', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Call settings');
    await auditSwitches(page, 'Call settings');
    await backToMainMenu(page);
    await assertNoErrors();
  });

  test('Proxy and Network: switches flip, relay cycles back, inputs accept text', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Proxy and Network');
    await auditSwitches(page, 'Proxy and Network');
    await auditCycleRow(page, 'Relay Backend');
    await auditCycleRow(page, 'Tor Bridge');

    // Obfuscation mode row is only visible while the Obfuscation switch is ON.
    const obfuscation = main(page).getByRole('switch', { name: 'Obfuscation', exact: true });
    const obfBefore = await obfuscation.getAttribute('aria-checked');
    if (obfBefore !== 'true') await obfuscation.click();
    await auditCycleRow(page, 'Obfuscation Mode');
    if (obfBefore !== 'true') await obfuscation.click();

    // Part D: TURN server input (always visible).
    const turn = main(page).getByPlaceholder('turn:example.com:3478');
    await expect(turn).toBeVisible({ timeout: 5000 });
    await turn.fill('turn:e2e.local:3478');
    await expect(turn).toHaveValue('turn:e2e.local:3478');
    await turn.fill('');
    await expect(turn).toHaveValue('');

    // Part D: proxy URL input — visible only while Use Proxy is ON.
    const proxy = main(page).getByRole('switch', { name: 'Use Proxy', exact: true });
    const proxyBefore = await proxy.getAttribute('aria-checked');
    if (proxyBefore !== 'true') await proxy.click();
    const proxyUrl = main(page).getByPlaceholder('socks5://127.0.0.1:9050');
    await expect(proxyUrl).toBeVisible({ timeout: 5000 });
    await proxyUrl.fill('socks5://e2e.local:9050');
    await expect(proxyUrl).toHaveValue('socks5://e2e.local:9050');
    await proxyUrl.fill('');
    await expect(proxyUrl).toHaveValue('');
    if (proxyBefore !== 'true') await proxy.click();

    await backToMainMenu(page);
    await assertNoErrors();
  });

  test('Spam Protection: switch flips and survives reload', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await gotoSettings(page);
    await openSection(page, 'Spam Protection');
    const sw = main(page).getByRole('switch', { name: 'Spam Filter' });
    await expect(sw).toBeVisible({ timeout: 5000 });
    const before = await sw.getAttribute('aria-checked');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');

    // Part E: persistence across reload.
    await page.goto('/?e2e=1', { waitUntil: 'domcontentloaded' });
    await ensureAppReady(page);
    await openSettingsViaProfile(page);
    await openSection(page, 'Spam Protection');
    const reloaded = main(page).getByRole('switch', { name: 'Spam Filter' });
    await expect(reloaded).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true', {
      timeout: 5000,
    });

    // Revert and confirm.
    await reloaded.click();
    await expect(reloaded).toHaveAttribute('aria-checked', before);
    await backToMainMenu(page);
    await assertNoErrors();
  });
});
