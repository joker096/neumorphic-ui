// Captures SEO article screenshots for the Mess&Anger article.
// Usage: node scripts/seo-screenshots.mjs
// Output: docs/seo/screenshots/*.png
// Boots the local mock app (VITE_USE_MOCK=true) on port 5199 and captures
// the live promo page. UI language: EN (RU captions applied in the article).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(root, 'docs', 'seo', 'screenshots');
const PORT = 5199;
// vite binds ::1 (localhost) by default — 127.0.0.1 is refused
const BASE = `http://localhost:${PORT}`;
// non-mock instance: registration flow (mock mode auto-approves identity)
const BASE_PLAIN = `http://localhost:${PORT + 1}`;

mkdirSync(OUT, { recursive: true });

function startVite(port, mock) {
  const child = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort'],
    {
      cwd: root,
      env: { ...process.env, VITE_USE_MOCK: mock ? 'true' : 'false' },
      stdio: ['ignore', 'ignore', 'pipe'],
    },
  );
  child.stderr.on('data', (d) => process.stderr.write(d));
  return child;
}

async function waitForServer(base) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/`);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`vite did not start on ${base}`);
}

async function boot(page) {
  await page.goto(`${BASE}/?e2e=1`, { waitUntil: 'domcontentloaded' });
  await page.locator('html[data-theme]').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1200);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name) });
  console.log('OK', name);
}

async function closeOverlays(page) {
  await page.keyboard.press('Escape');
  const close = page.getByLabel('Close').first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  }
  await page.waitForTimeout(400);
}

async function back(page) {
  await page.getByLabel(/back|go back/i).first().click();
  await page.getByPlaceholder('Search settings').waitFor({ timeout: 20_000 });
  await page.waitForTimeout(400);
}

async function main() {
  const viteMock = startVite(PORT, true);
  await waitForServer(BASE);
  const browser = await chromium.launch();
  let vitePlain = null;

  try {
    // ---------- Desktop: mock app (1440x900) ----------
    const ctxD = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'en-US',
    });
    const d = await ctxD.newPage();
    await boot(d);
    await shot(d, '04-main-desktop.png');

    // 05: conversation open
    await d.getByText('Alice Freeman').first().click();
    await d.getByPlaceholder('Message...').first().waitFor({ timeout: 20_000 });
    await d.waitForTimeout(800);
    await shot(d, '05-chat-window.png');

    // 06: safety numbers (contact profile -> Verify Security)
    await d.getByRole('button', { name: /alice freeman .*profile/i }).first().click();
    await d.getByText('Verify Security').first().click();
    await d.getByText(/safety numbers/i).first().waitFor({ timeout: 20_000 });
    await d.waitForTimeout(800);
    await shot(d, '06-safety-numbers.png');
    await closeOverlays(d);
    await closeOverlays(d);

    // 07: identity QR (contacts -> Share My Identity)
    await d.getByRole('button', { name: 'Contacts' }).first().click();
    await d.getByTestId('contacts-container').waitFor({ timeout: 20_000 });
    await d.locator('[title="Share My Identity"]').first().click();
    await d.getByRole('button', { name: /copy id/i }).waitFor({ timeout: 20_000 });
    await d.waitForTimeout(600);
    await shot(d, '07-identity-qr.png');
    await d.locator('[title="Close"]').first().click();
    await d.waitForTimeout(400);

    // 08-10: settings sections
    await d.getByRole('button', { name: 'User', exact: true }).click();
    await d.getByPlaceholder('Search settings').waitFor({ timeout: 20_000 });

    await d.getByText('Security', { exact: true }).first().click();
    await d.getByText('PIN Lock').first().waitFor({ timeout: 20_000 });
    await d.waitForTimeout(600);
    await shot(d, '08-security-settings.png');
    await back(d);

    await d.getByText('Proxy and Network', { exact: true }).first().click();
    await d.getByText('Relay Backend').first().waitFor({ timeout: 20_000 });
    await d.waitForTimeout(600);
    await shot(d, '09-network-settings.png');
    await back(d);

    await d.getByText('Privacy', { exact: true }).first().click();
    await d.getByText('Ghost View Mode').first().waitFor({ timeout: 20_000 });
    await d.waitForTimeout(600);
    await shot(d, '10-privacy-settings.png');
    await back(d);
    await ctxD.close();
    // ---------- Mobile: mock app (375x667) ----------
    const ctxM = await browser.newContext({
      viewport: { width: 375, height: 667 },
      locale: 'en-US',
    });
    const m = await ctxM.newPage();
    await boot(m);
    await shot(m, '11-mobile-chats.png');

    await m.getByText('Alice Freeman').first().click();
    await m.getByPlaceholder('Message...').first().waitFor({ timeout: 20_000 });
    await m.waitForTimeout(800);
    await shot(m, '12-mobile-chat.png');
    await ctxM.close();

    // ---------- Registration (non-mock vite: real auth gate) ----------
    vitePlain = startVite(PORT + 1, false);
    await waitForServer(BASE_PLAIN);
    const ctxR = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'en-US',
    });
    const r = await ctxR.newPage();
    await r.goto(`${BASE_PLAIN}/`, { waitUntil: 'domcontentloaded' });
    const createBtn = r.getByRole('button', { name: 'Create Identity' });
    await createBtn.waitFor({ timeout: 60_000 });
    await r.waitForTimeout(800);
    await shot(r, '02-registration.png');

    await createBtn.click();
    const writtenBtn = r.getByRole('button', { name: "I've Written It Down" });
    await writtenBtn.waitFor({ timeout: 60_000 });
    await r.waitForTimeout(800);
    await shot(r, '03-recovery-phrase.png');
    await ctxR.close();

    // ---------- Live promo page ----------
    const ctxP = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const p = await ctxP.newPage();
    await p.goto('https://mess.cvr.name/promo/', {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });
    await p.waitForTimeout(1200);
    await shot(p, '01-landing.png');
  } finally {
    await browser.close();
    viteMock.kill();
    if (vitePlain) vitePlain.kill();
  }
}

main()
  .then(() => console.log('All screenshots captured'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
