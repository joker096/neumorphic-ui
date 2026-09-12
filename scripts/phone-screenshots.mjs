// Generates Google Play phone screenshots (1080x1920 PNG) for Mess&Anger.
// Boots vite with VITE_USE_MOCK=true and drives the app with Playwright
// at a 360x640 mobile viewport @ DPR 3.
// Usage: node scripts/phone-screenshots.mjs
// Output: android/screenshots/phone-*.png
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SHOT_PORT ?? '5199');
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(root, 'android/screenshots');

function waitForServer(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      const req = http.get(url, (res) => {
        res.resume();
        res.on('end', () => resolve());
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) reject(new Error(`vite did not start on port ${PORT}`));
        else setTimeout(poll, 500);
      });
    })();
  });
}

const vite = spawn('node', [path.join(root, 'node_modules/vite/bin/vite.js'), '--port', String(PORT), '--strictPort', '--logLevel', 'error'], {
  cwd: root,
  env: { ...process.env, VITE_USE_MOCK: 'true' },
  stdio: ['ignore', 'inherit', 'inherit'],
});

let browser;
try {
  await waitForServer(`${BASE}/`, 90_000);
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    locale: 'en-US',
  });
  const page = await context.newPage();

  // 1. Chat list
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html[data-theme="dark"]', { timeout: 60_000 });
  await page.getByText('Alice Freeman').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'phone-1-chat-list.png') });

  // 2. Conversation (Alice Freeman)
  await page.getByText('Alice Freeman').first().click();
  await page.getByPlaceholder('Message...').waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'phone-2-conversation.png') });

  // 3. Contacts
  await page.getByRole('button', { name: 'Contacts' }).first().click();
  await page.getByText('Alice Freeman').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'phone-3-contacts.png') });

  // 4. Calls
  await page.getByRole('button', { name: 'Calls' }).first().click();
  await page.getByText('Alice Freeman').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'phone-4-calls.png') });

  console.log(`Wrote 4 screenshots to ${OUT}`);
} finally {
  await browser?.close();
  vite.kill();
}
