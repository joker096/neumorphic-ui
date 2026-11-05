import { test, expect, Page } from '@playwright/test';
import { ensureAppReady, openSettingsViaProfile } from './test-utils';

/**
 * Calls screen: call history, filter chips, search, dialpad.
 */

async function gotoCalls(page: Page) {
  await ensureAppReady(page);
  await page.getByRole('button', { name: 'Calls' }).first().click();
  await expect(page.getByPlaceholder('Search calls').first()).toBeVisible();
}

test.describe('Calls', () => {
  test('call history renders mock records', async ({ page }) => {
    await gotoCalls(page);
    await expect(page.getByText('Alice Freeman').first()).toBeVisible();
    await expect(page.getByText('Bob Smith').first()).toBeVisible();
    await expect(page.getByText(/5m 23s/).first()).toBeVisible();
  });

  test('search filters callable contacts', async ({ page }) => {
    await gotoCalls(page);
    await page.getByPlaceholder('Search calls').first().fill('Bob');
    await expect(page.getByText('Bob Smith').first()).toBeVisible();
    // Contact rows are pointers; Bob remains, unknown-number dial row can stay
    await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
  });

  test('search with no matches shows the empty subtitle', async ({ page }) => {
    await gotoCalls(page);
    await page.getByPlaceholder('Search calls').first().fill('zzz-no-matches');
    await expect(page.getByText(/your call history will appear here/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('clear all empties the call history', async ({ page }) => {
    await gotoCalls(page);
    const clearButton = page.locator('button[title="Clear all"]').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(page.getByText(/your call history will appear here|no calls yet/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('rejected incoming call is logged as declined', async ({ page }) => {
    await gotoCalls(page);
    const clearButton = page.locator('button[title="Clear all"]').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(page.getByText(/no calls yet/i).first()).toBeVisible({ timeout: 5000 });

    await openSettingsViaProfile(page);
    await page.getByText('Call settings', { exact: true }).first().click();
    await page.getByText('Simulate incoming call', { exact: true }).first().click();

    const acceptButton = page.getByRole('button', { name: 'Accept call' });
    await expect(acceptButton).toBeVisible();

    await page.getByRole('button', { name: 'Reject call' }).click();
    await expect(acceptButton).toBeHidden({ timeout: 5000 });

    await page.getByRole('button', { name: 'Calls' }).first().click();
    await expect(page.getByPlaceholder('Search calls').first()).toBeVisible();
    await expect(page.getByText('Alice Freeman', { exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Call back' })).toHaveCount(1);
  });

  test('accept with denied microphone access shows error and keeps the sheet open', async ({ page }) => {
    await gotoCalls(page);
    const clearButton = page.locator('button[title="Clear all"]').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(page.getByText(/no calls yet/i).first()).toBeVisible({ timeout: 5000 });

    await openSettingsViaProfile(page);
    await page.getByText('Call settings', { exact: true }).first().click();
    await page.getByText('Simulate incoming call', { exact: true }).first().click();

    const acceptButton = page.getByRole('button', { name: 'Accept call' });
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();

    // Headless may reject with permission, no-device, device-busy, or unknown
    await expect(
      page.getByText(
        /Microphone access denied|No microphone or camera found|Your microphone or camera is in use|Cannot start the call/,
      ),
    ).toBeVisible({ timeout: 5000 });
    await expect(acceptButton).toBeVisible();
  });

  test('accepting an incoming call fails fast when the required device is missing', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.enumerateDevices = () =>
        Promise.resolve([{ kind: 'videoinput', deviceId: 'cam', groupId: 'g', label: 'Camera' }] as MediaDeviceInfo[]);
    });
    await gotoCalls(page);
    const clearButton = page.locator('button[title="Clear all"]').first();
    if (await clearButton.isVisible()) await clearButton.click();
    await openSettingsViaProfile(page);
    await page.getByText('Call settings', { exact: true }).first().click();
    await page.getByText('Simulate incoming call', { exact: true }).first().click();

    const acceptButton = page.getByRole('button', { name: 'Accept call' });
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();

    // Preflight blocks before getUserMedia: no-device error, sheet stays open.
    await expect(page.getByText(/No microphone or camera found/)).toBeVisible({ timeout: 5000 });
    await expect(acceptButton).toBeVisible();
  });

  test('active call follows the network: drop shows reconnecting, recovery restores connected', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await gotoCalls(page);

    // Seed one declined history entry so a "Call back" row exists.
    const clearButton = page.locator('button[title="Clear all"]').first();
    if (await clearButton.isVisible()) await clearButton.click();
    await openSettingsViaProfile(page);
    await page.getByText('Call settings', { exact: true }).first().click();
    await page.getByText('Simulate incoming call', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Reject call' }).click();
    await page.getByRole('button', { name: 'Calls' }).first().click();
    await expect(page.getByPlaceholder('Search calls').first()).toBeVisible();

    await page.getByRole('button', { name: 'Call back' }).first().click();

    // Connecting -> connected (simulated handshake).
    // "Connecting..." also renders in the media stage, so scope to the first (top bar) match.
    await expect(page.getByText('Connecting...', { exact: true }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('connected', { exact: true })).toBeVisible({ timeout: 5000 });
    // Quality bars render with a level label (good/fair/poor depends on measured latency).
    await expect(page.getByLabel(/network/i)).toBeVisible();

    // Network drop -> reconnecting.
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText('Reconnecting...', { exact: true })).toBeVisible({ timeout: 5000 });

    // Network recovery -> connected again.
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.getByText('connected', { exact: true })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'End call' }).click();
    await expect(page.getByPlaceholder('Search calls').first()).toBeVisible({ timeout: 5000 });
  });

  test('active call surfaces network error on a prolonged drop, recovery restores connected', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await gotoCalls(page);

    const clearButton = page.locator('button[title="Clear all"]').first();
    if (await clearButton.isVisible()) await clearButton.click();
    await openSettingsViaProfile(page);
    await page.getByText('Call settings', { exact: true }).first().click();
    await page.getByText('Simulate incoming call', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Reject call' }).click();
    await page.getByRole('button', { name: 'Calls' }).first().click();
    await expect(page.getByPlaceholder('Search calls').first()).toBeVisible();

    await page.getByRole('button', { name: 'Call back' }).first().click();
    await expect(page.getByText('connected', { exact: true })).toBeVisible({ timeout: 5000 });

    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText('Reconnecting...', { exact: true })).toBeVisible({ timeout: 5000 });

    // Drop stays down beyond CallManager.NETWORK_ERROR_TIMEOUT_MS (10s) -> error state.
    await expect(page.getByText('Network error', { exact: true })).toBeVisible({ timeout: 15_000 });

    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(page.getByText('connected', { exact: true })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'End call' }).click();
    await expect(page.getByPlaceholder('Search calls').first()).toBeVisible({ timeout: 5000 });
  });

  test('video call shows a live local camera preview and re-attaches after a toggle', async ({ page, context }) => {
    await context.grantPermissions(['microphone', 'camera']);
    // Headless Chromium rejects real getUserMedia with NotSupportedError, so
    // replace it with a synthetic stream (animated canvas video + silent
    // audio) that exercises the same MediaStream pipeline the app uses.
    await page.addInitScript(() => {
      const makeVideoStream = () => {
        const stream = new MediaStream();
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        let frame = 0;
        const draw = () => {
          if (ctx) {
            frame += 1;
            ctx.fillStyle = frame % 2 ? '#4f46e5' : '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          requestAnimationFrame(draw);
        };
        requestAnimationFrame(draw);
        canvas.captureStream(10).getVideoTracks().forEach((t) => stream.addTrack(t));
        return stream;
      };
      let audioCtx;
      navigator.mediaDevices.getUserMedia = (constraints) => {
        const stream = makeVideoStream();
        if (constraints && constraints.audio) {
          if (!audioCtx) audioCtx = new AudioContext();
          const destination = audioCtx.createMediaStreamDestination();
          destination.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        }
        return Promise.resolve(stream);
      };
    });
    await gotoCalls(page);

    await openSettingsViaProfile(page);
    await page.getByText('Call settings', { exact: true }).first().click();
    await page.getByText('Simulate incoming call', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Accept as video' }).click();

    const pip = page.locator('div.cursor-grab video').first();
    const assertPipAttached = async () => {
      expect(await pip.evaluate((v) => (v as HTMLVideoElement).srcObject !== null)).toBe(true);
    };
    await expect(pip).toBeVisible({ timeout: 5000 });
    await assertPipAttached();

    // The control bar auto-hides after ~4s in a video call; clicking the stage
    // re-shows it (the avatar overlay covers the stage, so click through).
    const turnOffButton = page.getByRole('button', { name: 'Turn off video' });
    await expect(turnOffButton).toBeHidden({ timeout: 8000 });
    await page.locator('video').first().click({ force: true });
    await turnOffButton.click();
    await expect(pip).toHaveCount(0);

    await page.getByRole('button', { name: 'Turn on video' }).click();
    await expect(pip).toBeVisible({ timeout: 5000 });
    await assertPipAttached();

    await page.getByRole('button', { name: 'End call' }).click();
    await expect(page.getByText('Simulate incoming call', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('add new contact from calls screen opens form modal', async ({ page }) => {
    await gotoCalls(page);
    const addBtn = page.getByLabel('Add New Contact');
    if (await addBtn.count()) {
      await addBtn.first().click();
      await expect(page.getByPlaceholder('Contact Name')).toBeVisible();
      await page.getByRole('button', { name: 'Close' }).first().click();
    }
  });
});
