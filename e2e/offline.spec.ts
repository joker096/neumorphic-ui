import { test, expect, Page } from '@playwright/test';
import { ensureAppReady } from './test-utils';

async function openAliceChat(page: Page) {
  await ensureAppReady(page);
  await page.getByText('Alice Freeman').first().click();
  await expect(page.getByPlaceholder('Message...').first()).toBeVisible();
}

// The sandbox network blocks CDP offline emulation, so navigator.onLine is
// pinned to false. Override it in-page and dispatch the matching window event.
async function setOnline(page: Page, online: boolean) {
  await page.evaluate((value) => {
    Object.defineProperty(navigator, 'onLine', { value, configurable: true });
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  }, online);
}

async function pendingQueueItems(page: Page): Promise<any[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('messanger-queue-v2', 1);
      req.onupgradeneeded = (e) => {
        const d = (e.target as IDBRequest).result;
        if (!d.objectStoreNames.contains('pendingMessages')) {
          d.createObjectStore('pendingMessages', { autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return new Promise<any[]>((resolve) => {
      const req = db.transaction('pendingMessages', 'readonly').objectStore('pendingMessages').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  });
}

async function pendingQueueCount(page: Page): Promise<number> {
  return (await pendingQueueItems(page)).filter((m: any) => !m.sent).length;
}

const offlineBanner = (page: Page) => page.getByRole('status').filter({ hasText: 'Last synced' });

test.describe('Offline messaging', () => {
  test('offline banner appears when the browser goes offline', async ({ page }) => {
    await openAliceChat(page);
    await setOnline(page, true);
    await expect(offlineBanner(page)).toHaveCount(0);

    await setOnline(page, false);
    await expect(offlineBanner(page)).toBeVisible();
  });

  test('message sent offline stays queued after reconnect while no peer is reachable', async ({ page }) => {
    await openAliceChat(page);
    await setOnline(page, false);

    const input = page.getByPlaceholder('Message...').first();
    await input.fill('Offline queued message');
    await page.getByLabel('Send Message').first().click();

    await expect(page.getByText('Offline queued message').first()).toBeVisible();
    await expect(input).toHaveValue('');
    await expect.poll(() => pendingQueueCount(page)).toBe(1);

    await setOnline(page, true);
    await expect(offlineBanner(page)).toHaveCount(0);
    // No P2P peer is reachable in the sandbox, so the honest-fail path keeps
    // the frame queued (retried with backoff) instead of faking delivery.
    await expect.poll(() => pendingQueueCount(page)).toBe(1);
    const pending = (await pendingQueueItems(page)).filter((m: any) => !m.sent);
    expect(pending).toHaveLength(1);
    expect(pending[0].retryCount ?? 0).toBeGreaterThanOrEqual(1);
    await expect(page.getByText('Offline queued message').first()).toBeVisible();
  });
});
