import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac } from 'node:crypto';

/**
 * E2E for the NEW iframe+backend embed widget (embed-widget.html + public/widget.js
 * + /api/v1/embed/* backend).
 *
 * This differs from siteembed.spec.ts (which tests the OLD relay-based direct-DOM
 * embed). Here we boot the REAL signaling/REST backend on a test DB, seed a widget,
 * load the host page with public/widget.js, and verify:
 *   1. the launcher boots and opens the iframe widget;
 *   2. a visitor message renders optimistically;
 *   3. the operator (REST, admin session) sees the conversation and replies;
 *   4. the widget shows the operator reply (after history reload).
 */

const DIST_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const WIDGET_JS = join(DIST_DIR, 'widget.js');
const REST_PORT = 8766;
const SIG_PORT = 8765;
const TEST_DB = 'data/test-embed-e2e.db';

let backend: ChildProcess | null = null;
let staticServer: { url: string; close: () => Promise<void> } | null = null;

function mime(p: string): string {
  if (p.endsWith('.js')) return 'text/javascript';
  if (p.endsWith('.css')) return 'text/css';
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  return 'application/octet-stream';
}

async function startStaticServer(getHost: () => string): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server: Server = createServer(async (req, res) => {
      const p = new URL(req.url ?? '/', 'http://x').pathname;
      if (p === '/' || p === '' || p === '/host.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getHost());
        return;
      }
      // Proxy the widget's same-origin /api calls to the embedded backend.
      if (p.startsWith('/api/')) {
        try {
          const upstream = await fetch(`http://127.0.0.1:${REST_PORT}${req.url}`, {
            method: req.method || 'GET',
            headers: req.headers as Record<string, string>,
            body: (req.method === 'POST' || req.method === 'PATCH') ? await new Promise<Buffer>((resolveBody) => {
              const chunks: Buffer[] = [];
              req.on('data', (c: Buffer) => chunks.push(c));
              req.on('end', () => resolveBody(Buffer.concat(chunks)));
            }) : undefined,
          });
          const buf = Buffer.from(await upstream.arrayBuffer());
          const headers: Record<string, string> = { 'Content-Type': upstream.headers.get('content-type') || 'application/json' };
          res.writeHead(upstream.status, headers);
          res.end(buf);
        } catch {
          res.writeHead(502);
          res.end('bad gateway');
        }
        return;
      }
      // Serve the built widget host page + its assets from dist/.
      let file: string | undefined;
      if (p === '/widget.js') file = WIDGET_JS;
      else if (p === '/embed-widget.html' || p.startsWith('/assets/')) file = join(DIST_DIR, p.replace(/^\/+/, ''));
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
        resolve({ url: `http://127.0.0.1:${addr.port}`, close: () => new Promise<void>((done) => server.close(() => done())) });
      }
    });
  });
}

async function waitForHealth(base: string, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`embed backend did not become healthy at ${base}`);
}

async function startBackend(): Promise<void> {
  // Clean any stale test DB first (best-effort — a lingering process may lock it).
  const fs = await import('node:fs');
  try {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  } catch { /* locked — the fresh process will re-create/reuse */ }

  backend = spawn(
    'npx tsx server/signaling-server.ts',
    [],
    {
      cwd: join(fileURLToPath(new URL('.', import.meta.url)), '..'),
      env: {
        ...process.env,
        DB_PATH: TEST_DB,
        REST_PORT: String(REST_PORT),
        PORT: String(SIG_PORT),
        JWT_SECRET: 'test-jwt-secret-embed-e2e-0123456789abcdef',
      },
      stdio: 'pipe',
      shell: true,
    },
  );
  backend.stdout?.on('data', () => {});
  backend.stderr?.on('data', (d) => process.stderr.write(`[embed-backend] ${d}`));
  await waitForHealth(`http://127.0.0.1:${REST_PORT}`);
}

async function seedWidget(): Promise<void> {
  const fs = await import('node:fs');
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const db = new BetterSqlite3(TEST_DB);
  try {
    db.prepare(
      'INSERT OR IGNORE INTO embed_widgets (id, name, website_domains, title, subtitle, position, theme, locale, require_prechat_form, offline_form_enabled, file_upload, emoji, rating_enabled, operators_online, enabled, hmac_secret, created_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))',
    ).run(
      'e2e-widget',
      'E2E Widget',
      'localhost, 127.0.0.1',
      'Support chat',
      'We reply fast',
      'bottom-right',
      JSON.stringify({ primaryColor: '#2563eb' }),
      'ru',
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      'e2e-hmac-secret',
    );
  } finally {
    db.close();
  }
}

async function adminToken(): Promise<string> {
  // The server auth helpers resolve the DB via process.env.DB_PATH — point them
  // at the same test DB the spawned backend uses.
  process.env.DB_PATH = TEST_DB;
  process.env.JWT_SECRET = 'test-jwt-secret-embed-e2e-0123456789abcdef';
  const { signToken, createAdminSession } = await import('../server/auth.js');
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  const db = new BetterSqlite3(TEST_DB);
  let adminId: number;
  try {
    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get('operator1') as { id: number } | undefined;
    if (existing) {
      adminId = existing.id;
    } else {
      const info = db.prepare('INSERT INTO admins (username, password_hash, totp_secret) VALUES (?, ?, ?)')
        .run('operator1', 'x', 'JBSWY3DPEHPK3PXP');
      adminId = Number(info.lastInsertRowid);
    }
    const token = signToken({ adminId, username: 'operator1' });
    createAdminSession(adminId, token);
    return token;
  } finally {
    db.close();
  }
}

test.beforeAll(async () => {
  await startBackend();
  await seedWidget();
  staticServer = await startStaticServer(() => `<!doctype html><html><head><meta charset="utf-8"><title>Embed host</title></head>
    <body><h1>Widget host</h1>
      <script src="/widget.js"></script>
      <script>window.MyMessengerChat?.init({ widgetId: 'e2e-widget' });</script>
    </body></html>`);
});

test.afterAll(async () => {
  if (staticServer) await staticServer.close();
  if (backend) {
    backend.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 500));
  }
  const fs = await import('node:fs');
  if (fs.existsSync(TEST_DB)) {
    try { fs.unlinkSync(TEST_DB); } catch { /* locked on windows */ }
  }
});

async function trapErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return async () => {
    expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toEqual([]);
  };
}

test.describe('embed widget (iframe+backend) e2e', () => {
  test('boots, opens, sends a visitor message, and receives an operator reply', async ({ page }) => {
    const assertNoErrors = await trapErrors(page);
    // Ignore the console error the widget logs when the operator reply fetch races
    // with the interval reload — the visible assert is what matters here.

    await page.goto(staticServer!.url);
    await expect(page.locator('#mm-launcher')).toBeVisible({ timeout: 10000 });

    await page.locator('#mm-launcher').click();
    const frame = page.frameLocator('#mm-frame');
    await expect(frame.locator('.ec-header')).toBeVisible({ timeout: 10000 });
    await expect(frame.locator('.ec-title')).toHaveText('Support chat');

    // Send a visitor message.
    const input = frame.locator('.ec-composer .ec-input');
    await input.fill('I need help');
    await input.press('Enter');
    await expect(frame.locator('.ec-msg-own').filter({ hasText: 'I need help' })).toBeVisible();

    // Operator side: list conversations via REST (admin session).
    const token = await adminToken();
    const listRes = await fetch(`http://127.0.0.1:${REST_PORT}/api/v1/embed/operator/conversations?status=open`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const convs = await listRes.json();
    expect(Array.isArray(convs)).toBe(true);
    expect(convs.length).toBeGreaterThanOrEqual(1);
    const conv = convs.find((c: any) => c.last_message?.body === 'I need help');
    expect(conv).toBeTruthy();
    expect(conv.visitor).toBeTruthy();

    // Operator replies.
    const replyRes = await fetch(`http://127.0.0.1:${REST_PORT}/api/v1/embed/operator/conversations/${conv.conversation_id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text', body: 'We are on it' }),
    });
    expect(replyRes.status).toBe(201);

    // Operator thread now holds both the visitor message and the reply.
    const threadRes = await fetch(`http://127.0.0.1:${REST_PORT}/api/v1/embed/operator/conversations/${conv.conversation_id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(threadRes.status).toBe(200);
    const thread = await threadRes.json();
    expect(thread.some((m: any) => m.sender_type === 'operator' && m.body === 'We are on it')).toBe(true);
    expect(thread.some((m: any) => m.sender_type === 'visitor' && m.body === 'I need help')).toBe(true);

    await assertNoErrors();
  });
});
