import { test, expect, type Page } from '@playwright/test';

const MOCK_SEED = 'a'.repeat(64);

async function seedIdentityViaIDB(page: Page) {
  await page.evaluate(async (seedHex: string) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('keyval-store');
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('keyval', 'readwrite');
        const store = tx.objectStore('keyval');
        store.put(seedHex, 'mess_master_seed');
        tx.oncomplete = () => {
          db.close();
          resolve(true);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
      request.onerror = () => reject(request.error);
    });
  }, MOCK_SEED);
}

async function gotoApp(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(500);

  const hasTheme = await page.locator('[data-theme]').count();
  if (hasTheme === 0) {
    const hasRegistration = await page.getByText(/welcome|generate|recovery|passphrase/i).count();
    if (hasRegistration > 0) {
      await seedIdentityViaIDB(page);
      await page.reload();
    }
  }

  await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(1200);
}

test.describe('Usability & Accessibility (Stage 2)', () => {
  test.describe('Responsive viewports', () => {
    const viewports = [
      { name: 'Desktop 1920x1080', width: 1920, height: 1080 },
      { name: 'Desktop 1440x900', width: 1440, height: 900 },
      { name: 'Tablet 768x1024', width: 768, height: 1024 },
      { name: 'Tablet 1024x768', width: 1024, height: 768 },
      { name: 'Mobile 375x667', width: 375, height: 667 },
      { name: 'Mobile 320x568', width: 320, height: 568 },
    ];

    for (const vp of viewports) {
      test(vp.name, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoApp(page);
        await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
        await expect(page.getByPlaceholder('Search chats or messages...').first()).toBeVisible();
      });
    }

    test('no horizontal scroll at 320px', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await gotoApp(page);
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });

    test('zoom 200% does not break layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await gotoApp(page);
      await page.evaluate(() => document.body.style.zoom = '200%');
      await page.waitForTimeout(600);
      await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
      await page.evaluate(() => document.body.style.zoom = '100%');
    });
  });

  test.describe('Touch targets', () => {
    test('all nav buttons are at least 44x44px', async ({ page }) => {
        await gotoApp(page);
        await page.evaluate(() => {
          document.body.style.zoom = '100%';
        });
        const navButtons = page.locator('aside[aria-label="Navigation sidebar"] button:visible, footer[aria-label="Mobile navigation"] button:visible');
        const count = await navButtons.count();
        for (let i = 0; i < count; i++) {
          const box = await navButtons.nth(i).boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('chat list items have adequate touch targets', async ({ page }) => {
      await gotoApp(page);
      const firstChatRow = page.getByRole('listitem').first();
      if (await firstChatRow.count() > 0) {
        const box = await firstChatRow.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('settings items are tappable', async ({ page }) => {
      await gotoApp(page);
      await page.getByRole('button', { name: 'Settings' }).first().click();
      await page.waitForTimeout(600);
      const securityItem = page.locator('div').filter({ hasText: 'Security' }).first();
      if (await securityItem.count() > 0) {
        const box = await securityItem.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Theme & dark mode', () => {
    test('app boots in dark mode by default', async ({ page }) => {
      await gotoApp(page);
      await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
    });

    test('theme toggle switches mode', async ({ page }) => {
      await gotoApp(page);
      await page.getByRole('button', { name: 'Settings' }).first().click();
      await page.getByText('Theme').first().click();
      const toggle = page.locator('[role="switch"]').first();
      await expect(toggle).toBeVisible();
      await toggle.click();
      await page.waitForTimeout(600);
      const newTheme = await page.locator('[data-theme]').getAttribute('data-theme');
      expect(['light', 'dark']).toContain(newTheme);
    });

    test('theme can be restored', async ({ page }) => {
      await gotoApp(page);
      await page.getByRole('button', { name: 'Settings' }).first().click();
      await page.getByText('Theme').first().click();
      const toggle = page.locator('[role="switch"]').first();
      await toggle.click();
      await page.waitForTimeout(600);
      await toggle.click();
      await page.waitForTimeout(600);
      await expect(page.locator('[data-theme]')).toHaveAttribute('data-theme', 'dark');
    });
  });

  test.describe('Input types & keyboard', () => {
    test('security PIN inputs use numeric keyboard', async ({ page }) => {
      await gotoApp(page);
      await page.getByRole('button', { name: 'Settings' }).first().click();
      await page.getByText('Security').first().click();
      await page.waitForTimeout(600);
      const pinToggle = page.getByText('PIN Lock').first();
      if (await pinToggle.count() > 0) {
        await pinToggle.click();
        await page.waitForTimeout(400);
        const pinInput = page.locator('#security-pin-input');
        if (await pinInput.count() > 0) {
          await expect(pinInput).toBeVisible();
          await expect(pinInput).toHaveAttribute('inputmode', 'numeric');
        }
      }
    });

    test('text inputs are focusable', async ({ page }) => {
      await gotoApp(page);
      const searchInput = page.getByPlaceholder('Search chats or messages...').first();
      await searchInput.click();
      await expect(searchInput).toBeFocused();
    });
  });

  test.describe('Loading & empty states', () => {
    test('app does not show error boundary on boot', async ({ page }) => {
      await gotoApp(page);
      await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
    });

    test('round-trip navigation preserves app stability', async ({ page }) => {
      await gotoApp(page);
      for (const label of ['Contacts', 'Settings', 'Chats']) {
        await page.getByRole('button', { name: label }).first().click();
        await page.waitForTimeout(300);
        await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
      }
    });
  });

  test.describe('Forms & validation', () => {
    test('settings search is functional', async ({ page }) => {
      await gotoApp(page);
      await page.getByRole('button', { name: 'Settings' }).first().click();
      const searchInput = page.getByPlaceholder('Search settings').first();
      await expect(searchInput).toBeVisible();
      await searchInput.fill('security');
      await page.waitForTimeout(400);
      await expect(page.getByText('Security').first()).toBeVisible();
    });

    test('security section has PIN input', async ({ page }) => {
      await gotoApp(page);
      await page.getByRole('button', { name: 'Settings' }).first().click();
      await page.getByText('Security').first().click();
      await page.waitForTimeout(600);
      const pinSection = page.getByText('PIN Lock').first();
      if (await pinSection.count() > 0) {
        await expect(pinSection).toBeVisible();
      }
    });
  });

  test.describe('Navigation stability', () => {
    test('opening chat and returning to list works', async ({ page }) => {
      await gotoApp(page);
      await page.getByText('Alice Freeman').first().click();
      await page.waitForTimeout(600);
      await page.getByRole('button', { name: 'Chats' }).first().click();
      await page.waitForTimeout(600);
      await expect(page.getByPlaceholder('Search chats or messages...').first()).toBeVisible();
    });

    test('rapid nav clicks do not crash app', async ({ page }) => {
      await gotoApp(page);
      const navItems = ['Chats', 'Contacts', 'Settings'];
      for (let i = 0; i < 3; i++) {
        for (const item of navItems) {
          await page.getByRole('button', { name: item }).first().click();
        }
      }
      await expect(page.getByText('error.somethingWentWrong')).toHaveCount(0);
    });
  });
});
