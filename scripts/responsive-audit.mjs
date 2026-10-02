// Responsive / visual audit harness for Mess&Anger.
//
// Boots vite with VITE_USE_MOCK=true, drives the app through its primary
// screens at a matrix of viewports, and for every (viewport, screen) pair:
//   - writes a PNG screenshot into test-results/responsive/
//   - runs DOM checks for horizontal overflow and out-of-viewport elements
//
// Usage: node scripts/responsive-audit.mjs [--only=chats,conversation]
// Output: test-results/responsive/*.png + test-results/responsive/report.json
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.AUDIT_PORT ?? '5197');
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(root, 'test-results/responsive');

const VIEWPORTS = [
  { name: 'xs320', width: 320, height: 568, dpr: 2 },
  { name: 'sm360', width: 360, height: 640, dpr: 3 },
  { name: 'phone390', width: 390, height: 844, dpr: 3 },
  { name: 'phone430', width: 430, height: 932, dpr: 3 },
  { name: 'land568', width: 568, height: 320, dpr: 2 },
  { name: 'land667', width: 667, height: 375, dpr: 2 },
  { name: 'land844', width: 844, height: 390, dpr: 3 },
  { name: 'land926', width: 926, height: 428, dpr: 3 },
  { name: 'tablet768', width: 768, height: 1024, dpr: 2 },
  { name: 'tablet820', width: 820, height: 1180, dpr: 2 },
  { name: 'tabletLand1024', width: 1024, height: 768, dpr: 2 },
  { name: 'laptop1280', width: 1280, height: 800, dpr: 1 },
  { name: 'desktop1440', width: 1440, height: 900, dpr: 1 },
  { name: 'desktop1920', width: 1920, height: 1080, dpr: 1 },
  { name: 'ultrawide2560', width: 2560, height: 1080, dpr: 1 },
];

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;

const screens = [
  { id: 'chats', run: async () => {} },
  {
    id: 'conversation',
    run: async (page) => {
      await page.getByText('Alice Freeman').first().click();
      await page.getByPlaceholder('Message...').first().waitFor({ state: 'visible', timeout: 15000 });
    },
  },
  {
    id: 'contacts',
    run: async (page) => {
      await page.getByRole('button', { name: 'Contacts' }).first().click();
      await page.getByText('Alice Freeman').first().waitFor({ state: 'visible', timeout: 15000 });
    },
  },
  {
    id: 'calls',
    run: async (page) => {
      await page.getByRole('button', { name: 'Calls' }).first().click();
      await page.waitForTimeout(500);
    },
  },
  {
    id: 'settings',
    run: async (page) => {
      await page.getByRole('button', { name: 'User', exact: true }).first().click();
      await page.getByPlaceholder('Search settings').waitFor({ state: 'visible', timeout: 15000 });
    },
  },
].filter((s) => !ONLY || ONLY.has(s.id));

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

/** DOM probe: horizontal overflow + elements poking out of the viewport. */
const PROBE = `(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const doc = document.documentElement;
  const overflowX = Math.max(doc.scrollWidth - vw, document.body.scrollWidth - vw);
  const offenders = [];
  const seen = new Set();
  const describe = (el) => {
    if (!el || !el.tagName) return 'unknown';
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = (el.getAttribute && el.getAttribute('class')) || '';
    const first = cls.split(/\\s+/).filter(Boolean).slice(0, 4).join('.');
    if (first) s += '.' + first;
    return s;
  };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const key = describe(el);
    if (r.right > vw + 1.5 || r.left < -1.5) {
      // Intentional off-canvas: closed swipe buckets are inert (house pattern: e2e/ui-audit.spec.ts);
      // visually-hidden skip links sit at a large negative offset.
      if (el.closest('[inert]')) continue;
      if (r.left < -1000) continue;
      const inFittedHScroll = (() => {
        let node = el.parentElement;
        while (node && node !== document.body && node !== document.documentElement) {
          const ncs = getComputedStyle(node);
          const nr = node.getBoundingClientRect();
          if ((ncs.overflowX === 'auto' || ncs.overflowX === 'scroll') && node.scrollWidth > node.clientWidth && nr.right <= vw + 1 && nr.left >= 0) return true;
          node = node.parentElement;
        }
        return false;
      })();
      if (inFittedHScroll) continue;
      const dedup = key + Math.round(r.left) + Math.round(r.right);
      if (seen.has(dedup)) continue;
      seen.add(dedup);
      offenders.push({
        sel: describe(el),
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
        overflowRight: Math.round(r.right - vw),
      });
    }
  }
  offenders.sort((a, b) => b.overflowRight - a.overflowRight);
  return { vw, vh, overflowX, offenders: offenders.slice(0, 25) };
})()`;

let vite;
let browser;
const report = [];

try {
  await mkdir(OUT, { recursive: true });
  vite = spawn('node', [path.join(root, 'node_modules/vite/bin/vite.js'), '--port', String(PORT), '--strictPort', '--logLevel', 'error'], {
    cwd: root,
    env: { ...process.env, VITE_USE_MOCK: 'true' },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  await waitForServer(`${BASE}/`, 90_000);
  browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      locale: 'en-US',
    });
    const page = await context.newPage();
    for (const screen of screens) {
      const entry = { viewport: vp.name, width: vp.width, height: vp.height, screen: screen.id };
      try {
        await page.goto(`${BASE}/?e2e=1`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('html[data-theme="dark"]', { timeout: 60000 });
        await page.waitForTimeout(900);
        await screen.run(page);
        await page.waitForTimeout(600);
        const probe = await page.evaluate(PROBE);
        entry.overflowX = probe.overflowX;
        entry.offenders = probe.offenders;
        await page.screenshot({ path: path.join(OUT, `${vp.name}__${screen.id}.png`) });
      } catch (err) {
        entry.error = String((err && err.message) || err).split('\n')[0];
      }
      report.push(entry);
      const flag = entry.error ? `ERR ${entry.error}` : `overflowX=${entry.overflowX} offenders=${(entry.offenders || []).length}`;
      console.log(`${vp.name}/${screen.id}: ${flag}`);
    }
    await context.close();
  }

  await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport: ${path.join(OUT, 'report.json')}`);
} finally {
  await browser?.close();
  vite?.kill();
}
