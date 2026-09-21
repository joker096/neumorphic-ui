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
