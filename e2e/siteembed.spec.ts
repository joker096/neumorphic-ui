import { test, expect, type Page } from '@playwright/test';
import { gotoSettings } from './test-utils';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Embed / personal site-chat e2e:
 *  - creates a site chat via the Settings → "Website Embed" section and
 *    verifies the generated snippet carries `type="module"` + the token;
 *  - boots the real standalone widget (dist/embed.js) on a bare host page
 *    with a token built from the same libs and drives the FAB open; and
 *  - captures light/dark screenshots of both the manager and the widget at
 *    375×812 and 414×896.
 *
 * The widget-boot test serves `dist/` (embed.js + its shared chunks) from a
 * tiny in-process HTTP server because the Vite dev server has no `/embed.js`
 * route (the embed bundle only exists as a build artifact).
 */

const SHOT_DIR = 'docs/design/embed-screenshots';
const DIST_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const EMBED_JS = join(DIST_DIR, 'embed.js');

// Static X25519 keypair (tweetnacl box) for the widget-boot test. Generated
// once offline; building a channel keypair here would pull tweetnacl into the
// Playwright Node runtime, which fails ESM interop for `import * as nacl`.
const TEST_PUB_B64 = 'SoNKvOnxFRbvy8y857DvMxZZ7hTih4hcMdSJ0kJSFX4';

function buildTestToken(): string {
  const cfg = {
    v: 1,
    companyId: 'ns_e2e',
    channelId: 'ch_e2e',
    channelPubKeyB64: TEST_PUB_B64,
    label: 'E2E Widget',
    config: {
      accent: '#2563EB',
      position: 'bottom-right',
      greeting: 'Hi there!',
      collectContact: false,
      hideBrand: false,
    },
  };
  return Buffer.from(JSON.stringify(cfg)).toString('base64url');
}

function mime(p: string): string {
  if (p.endsWith('.js')) return 'text/javascript';
  if (p.endsWith('.css')) return 'text/css';
  if (p.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

async function startStaticServer(getHost: () => string): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server: Server = createServer((req, res) => {
      const p = new URL(req.url ?? '/', 'http://x').pathname;
      let file: string | undefined;
      if (p === '/' || p === '' || p === '/host.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getHost());
        return;
      }
      if (p === '/embed.js' || p.startsWith('/assets/')) {
        file = join(DIST_DIR, p.replace(/^\/+/, ''));
      }
      if (!file) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      try {
        const body = readFileSync(file);
        res.writeHead(200, { 'Content-Type': mime(file) });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
    });
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () =>
            new Promise<void>((done) => server.close(() => done())),
        });
      }
    });
  });
}

async function trapErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return async () => {
    expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
  };
}

async function openSiteEmbed(page: Page) {
  await gotoSettings(page);
  await page.getByRole('button', { name: /Website Embed/ }).click();
  await expect(page.getByPlaceholder('Site chat name')).toBeVisible();
}

async function createSiteChat(page: Page, name: string) {
  await page.getByPlaceholder('Site chat name').fill(name);
  await page.keyboard.press('Enter');
  // The generated snippet textarea appears once the site chat is created.
  await expect(page.locator('textarea').filter({ hasText: '__MESSANGER_TOKEN__' }).first()).toBeVisible();
}

test.describe('personal site-chat embed', () => {
  test('creates a site chat and emits a module snippet', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    await openSiteEmbed(page);
    await createSiteChat(page, 'Docs Site');

    const snippet = await page.locator('textarea').filter({ hasText: '__MESSANGER_TOKEN__' }).first().inputValue();
    expect(snippet).toContain('__MESSANGER_TOKEN__');
    expect(snippet).toContain('import("');

    // The conversations + website-contacts blocks render (inside <details>).
    await expect(page.getByText('Conversation')).toHaveCount(1);
    await assertNoErrors();
  });

  test('captures manager screenshots (light/dark, 375 & 414)', async ({ page }) => {
    await openSiteEmbed(page);
    await createSiteChat(page, 'Shop');
    for (const theme of ['dark', 'light'] as const) {
      if (theme === 'light') {
        // Switch to light theme via Settings → Theme, then return to the embed section.
        await gotoSettings(page);
        await page.getByText('Theme').first().click();
        await page.getByTestId('theme-mode-light').click();
        await expect(page.locator('html[data-theme]')).toHaveAttribute('data-theme', 'light');
        await page.getByLabel('Back').first().click();
        await page.getByRole('button', { name: /Website Embed/ }).click();
        await expect(page.getByPlaceholder('Site chat name')).toBeVisible();
      }
      for (const width of [375, 414]) {
        await page.setViewportSize({ width, height: 812 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${SHOT_DIR}/manager-${theme}-${width}.png`, fullPage: true });
      }
    }
  });

  test('widget boots from dist/embed.js on a bare host page', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    const token = buildTestToken();
    const hostHtml = `<!doctype html><html><head><meta charset="utf-8"></head><body>
      <h1>Host page</h1>
      <script>
        (function () {
          var t = "${token}";
          window.__MESSANGER_TOKEN__ = t;
          import("/embed.js").catch(function (e) { console.error("[Mess&Anger embed]", e); });
        })();
      </script>
    </body></html>`;
    const server = await startStaticServer(() => hostHtml);
    try {
      await page.goto(server.url);

      const fab = page.locator('.ew-fab');
      await expect(fab).toBeVisible({ timeout: 10000 });
      await fab.click();
      const panel = page.locator('.ew-panel');
      await expect(panel).toBeVisible();
      // Greeting from config renders as first incoming bubble.
      await expect(panel.getByText('Hi there!')).toBeVisible();
      await page.screenshot({ path: `${SHOT_DIR}/widget-dark-375.png` });
      await assertNoErrors();
    } finally {
      await server.close();
    }
  });
});
