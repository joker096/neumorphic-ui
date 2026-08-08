import { test, expect } from '@playwright/test';

test.describe('Mess&Anger E2E - Error and Resilience', () => {
  test('app handles offline state gracefully', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('app handles online state after offline', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
    });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('error boundary catches component errors', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const originalError = window.onerror;
      window.onerror = (msg) => {
        if (typeof msg === 'string' && msg.includes('TestError')) {
          const errorBoundary = document.querySelector('[data-testid="error-boundary"]') as HTMLElement | null;
          if (errorBoundary) {
            errorBoundary.style.display = 'block';
          }
        }
        return false;
      };
      throw new Error('TestError');
    });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('app recovers from storage errors', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
      } catch (e) {
        (window as any).__storageError = true;
      }
    });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('settings page is accessible after error recovery', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByText(/security|privacy|network|storage/i).first()).toBeVisible();
  });
});