import { defineConfig } from '@playwright/test';

const PLAYWRIGHT_PORT = Number(process.env.PW_PORT ?? '5173');
const PLAYWRIGHT_BASE_URL = process.env.PW_BASE_URL ?? `http://localhost:${PLAYWRIGHT_PORT}`;

/**
 * Playwright config for visual/functional e2e tests of Mess&Anger.
 *
 * The app under test boots with VITE_USE_MOCK=true so that the store is
 * seeded with deterministic mock chats/contacts/channels/calls. Without it
 * the app renders an empty onboarding state and most UI paths are dead.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: './test-results',
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    headless: true,
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx vite --port ${PLAYWRIGHT_PORT}`,
    port: PLAYWRIGHT_PORT,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { VITE_USE_MOCK: 'true' },
  },
});
