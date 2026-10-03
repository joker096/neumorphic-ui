import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';

import { ensureAppReady } from './test-utils';

const WS_PORT = 8971;
const REST_PORT = 8766;
const HEALTH_URL = `http://127.0.0.1:${REST_PORT}/health`;
const DB_PATH = path.resolve('data/e2e-dual-peer.db');
const TSX_CLI = path.resolve('node_modules/tsx/dist/cli.mjs');
const APP_ORIGIN = 'http://localhost:5173';

let child: ChildProcess | null = null;
let serverLog = '';

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

function healthOk(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    });
    req.setTimeout(1500, () => req.destroy());
    req.on('error', () => resolve(false));
  });
}

function removeDbFiles(): void {
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      fs.rmSync(DB_PATH + suffix, { force: true });
    } catch {
      /* best-effort cleanup */
    }
  }
}

function killServer(): Promise<void> {
  if (!child || child.exitCode !== null) return Promise.resolve();
  const proc = child;
  return new Promise((resolve) => {
    const force = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* process already gone */
      }
    }, 5000);
    proc.once('exit', () => {
      clearTimeout(force);
      resolve();
    });
    try {
      proc.kill('SIGTERM');
    } catch {
      clearTimeout(force);
      resolve();
    }
  });
}

test.describe.configure({ timeout: 90_000 });

test.beforeAll(async () => {
  test.setTimeout(90_000);
  removeDbFiles();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const busy: string[] = [];
  if (await isPortOpen(WS_PORT)) busy.push(String(WS_PORT));
  if (await isPortOpen(REST_PORT)) busy.push(String(REST_PORT));
  if (busy.length > 0) {
    throw new Error(`Port(s) already in use, cannot spawn test signaling server: ${busy.join(', ')}`);
  }

  child = spawn(process.execPath, [TSX_CLI, 'server/signaling-server.ts'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(WS_PORT),
      REST_PORT: String(REST_PORT),
      JWT_SECRET: randomBytes(32).toString('hex'),
      DB_PATH,
      ALLOWED_ORIGINS: APP_ORIGIN,
    },
  });
  child.stdout?.on('data', (chunk: string | Buffer) => {
    serverLog += chunk.toString();
  });
  child.stderr?.on('data', (chunk: string | Buffer) => {
    serverLog += chunk.toString();
  });

  const deadline = Date.now() + 30_000;
  let ready = false;
  while (Date.now() < deadline) {
    ready = (await healthOk()) && (await isPortOpen(WS_PORT));
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) {
    const log = serverLog.slice(-2000);
    await killServer();
    child = null;
    throw new Error(`Test signaling server did not become healthy within 30s.\n${log}`);
  }
});

test.afterAll(async () => {
  test.setTimeout(90_000);
  await Promise.race([killServer(), new Promise((resolve) => setTimeout(resolve, 10_000))]);
  child = null;
  removeDbFiles();
});

test('two independent browser contexts both reach Connection: Direct via local signaling', async ({ browser }) => {
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await ensureAppReady(pageA);

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await ensureAppReady(pageB);

  const statusA = pageA.locator('[role="status"][aria-label="Connection: Direct"]').first();
  await expect(statusA).toBeVisible({ timeout: 20_000 });

  const statusB = pageB.locator('[role="status"][aria-label="Connection: Direct"]').first();
  await expect(statusB).toBeVisible({ timeout: 20_000 });

  await contextA.close();
  await contextB.close();
});

test('idle B answers an inbound offer over a dial-back transport (M021)', async ({ browser }) => {
  test.setTimeout(90_000);

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await ensureAppReady(pageA);

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await ensureAppReady(pageB);

  const hex = (bytes: Uint8Array) => Array.from(bytes).map((x) => x.toString(16).padStart(2, '0')).join('');

  // Seed each context with an identity seed and reload — the main WS then
  // registers the identity key (registerMainIdentity runs on connect).
  const seedIdentity = (page: import('@playwright/test').Page) =>
    page.evaluate(async () => {
      const { getMasterKeySet, hasMasterIdentity } = await import('/src/lib/identity/masterKey.ts');
      const ks = await getMasterKeySet();
      const hex = (bytes: Uint8Array) =>
        Array.from(bytes).map((x) => x.toString(16).padStart(2, '0')).join('');
      return { pub: hex(ks.ed25519Public), has: await hasMasterIdentity() };
    });

  const a = await seedIdentity(pageA);
  const b = await seedIdentity(pageB);
  expect(a.has).toBe(true);
  expect(b.has).toBe(true);

  await pageA.reload();
  await pageB.reload();
  await expect(pageA.locator('[role="status"][aria-label^="Connection:"]').first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(pageB.locator('[role="status"][aria-label^="Connection:"]').first()).toBeVisible({
    timeout: 20_000,
  });

  // Server sees both identity keys online (bound on the main WS). Registration
  // is best-effort async after the WS opens — poll instead of one-shot fetch.
  for (const pub of [a.pub, b.pub]) {
    await expect
      .poll(async () => {
        const res = await fetch(`http://127.0.0.1:${REST_PORT}/api/peers/${pub}`).then((r) => r.json());
        return res.online === true;
      }, { timeout: 15_000 })
      .toBe(true);
  }

  // A dials B with a real WebRTC transport. B is idle — its transport is
  // created on demand when the offer lands on the main WS (dial-back).
  await pageA.evaluate(async (target) => {
    const { p2pNetwork } = await import('/src/lib/p2p/network.ts');
    await p2pNetwork.connect(target);
  }, b.pub);

  // B must end up with a connected transport for A — the inbound dial-back
  // path: main-WS offer → acceptInboundOffer → fresh transport → answer.
  let stateB: any = null;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    stateB = await pageB.evaluate(async (caller) => {
      const { p2pNetwork } = await import('/src/lib/p2p/network.ts');
      const t = (p2pNetwork as any)['transports'].get(caller);
      const pc = t?.peerConnection;
      return {
        hasTransport: !!t,
        connected: !!p2pNetwork['peers'].get(caller)?.connected,
        pcState: pc?.connectionState ?? null,
        sigState: pc?.signalingState ?? null,
        iceState: pc?.iceConnectionState ?? null,
        keys: t ? Object.keys(t).join(',') : null,
      };
    }, a.pub);
    if (stateB.connected) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  expect(stateB.connected).toBe(true);

  // A sees B connected as well.
  await expect
    .poll(
      async () =>
        pageA.evaluate(async (target) => {
          const { p2pNetwork } = await import('/src/lib/p2p/network.ts');
          return !!p2pNetwork['peers'].get(target)?.connected;
        }, b.pub),
      { timeout: 30_000 },
    )
    .toBe(true);

  await contextA.close();
  await contextB.close();
});
