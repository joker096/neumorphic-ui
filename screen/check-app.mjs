import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname);
const BASE = 'http://localhost:5173/';

const results = {
  theme: { initial: {}, light: {}, mobileLight: {} },
  viewports: { desktop: {}, mobile: {} },
  components: [],
  issues: [],
  screenshots: [],
};

function ss(rel) {
  if (!results.screenshots) results.screenshots = [];
  results.screenshots.push(rel);
}

async function screenshot(page, name, full = false) {
  const fname = `${name}.png`;
  await page.screenshot({ path: path.join(outDir, fname), fullPage: full });
  ss(fname);
}

async function ready(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageD = await desktop.newPage();

  try {
    await ready(pageD);

    const domInfo = await pageD.evaluate(() => {
      const root = document.querySelector('#root > div');
      const outerAside = document.querySelector('aside');
      const innerAside = outerAside ? outerAside.querySelector('aside') : null;
      const footer = document.querySelector('footer');
      return {
        theme: root ? root.getAttribute('data-theme') : null,
        rootBg: root ? getComputedStyle(root).backgroundColor : null,
        asideVisible: innerAside ? innerAside.offsetWidth > 0 : false,
        footerVisible: footer ? footer.offsetWidth > 0 : false,
        bodyText: document.body.textContent?.substring(0, 200) || '',
      };
    });
    results.theme.initial.desktop = domInfo;
    results.viewports.desktop = { width: 1440, height: 900, sidebarVisible: domInfo.asideVisible };

    await screenshot(pageD, 'desktop-dark', true);

    // Navigate to settings
    await pageD.evaluate(() => {
      const outerAside = document.querySelector('aside');
      const nav = outerAside ? outerAside.querySelector('nav') : null;
      if (nav) {
        const buttons = nav.querySelectorAll('button');
        if (buttons[4]) buttons[4].click();
      }
    });
    await pageD.waitForTimeout(800);
    await screenshot(pageD, 'desktop-settings', true);

    // Click Appearance section (first button with Palette icon or text containing "Theme"/"Тема")
    const appearanceBtn = pageD.locator('button:has-text("Тема"), button:has-text("Theme"), button:has([class*="Palette"])').first();
    if (await appearanceBtn.count() > 0) {
      await appearanceBtn.click();
      await pageD.waitForTimeout(600);
      await screenshot(pageD, 'desktop-appearance', true);

      const themeSwitch = pageD.locator('[role="switch"]').first();
      const switchVisible = await themeSwitch.count() > 0 && await themeSwitch.isVisible().catch(() => false);
      results.components.push({ name: 'desktop-theme-toggle', visible: switchVisible });

      if (switchVisible) {
        await themeSwitch.click();
        await pageD.waitForTimeout(400);
        const lightInfo = await pageD.evaluate(() => {
          const root = document.querySelector('#root > div');
          if (!root) return null;
          return { theme: root.getAttribute('data-theme'), bg: getComputedStyle(root).backgroundColor };
        });
        results.theme.light.desktop = lightInfo;
        await screenshot(pageD, 'desktop-light', true);
        await themeSwitch.click();
        await pageD.waitForTimeout(300);
        await screenshot(pageD, 'desktop-dark-again', true);
      } else {
        results.theme.lightSwitchNotFound = true;
      }
    } else {
      results.issues.push('appearance-btn: NOT FOUND');
    }

    // Verify nav back to chats
    await pageD.evaluate(() => {
      const outerAside = document.querySelector('aside');
      const nav = outerAside ? outerAside.querySelector('nav') : null;
      if (nav) {
        const buttons = nav.querySelectorAll('button');
        if (buttons[0]) buttons[0].click();
      }
    });
    await pageD.waitForTimeout(300);
    results.components.push({
      name: 'desktop-sidebar',
      visible: await pageD.locator('aside:nth-child(2)').isVisible().catch(() => false),
    });
    await screenshot(pageD, 'desktop-back-to-chats', true);

    // Check chat input
    const chatInput = pageD.locator('textarea, input[type="text"]').first();
    results.components.push({
      name: 'desktop-chat-input',
      visible: await chatInput.count() > 0 && await chatInput.isVisible().catch(() => false),
    });
  } catch (e) {
    results.error = e.message;
  } finally {
    await desktop.close();
  }

  // Mobile
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageM = await mobile.newPage();

  try {
    await ready(pageM);

    const mobileInfo = await pageM.evaluate(() => {
      const root = document.querySelector('#root > div');
      const footer = document.querySelector('footer');
      return {
        theme: root ? root.getAttribute('data-theme') : null,
        bg: root ? getComputedStyle(root).backgroundColor : null,
        footerVisible: footer ? footer.offsetWidth > 0 : false,
        footerClass: footer ? footer.className : null,
      };
    });
    results.viewports.mobile.info = mobileInfo;
    await screenshot(pageM, 'mobile-dark', true);

    const btnCount = await pageM.locator('footer button').count();
    results.viewports.mobile.bottomNavButtons = btnCount;

    if (btnCount > 0) {
      await pageM.locator('footer button').nth(btnCount - 1).click();
      await pageM.waitForTimeout(800);
      await screenshot(pageM, 'mobile-settings', true);

      const appearanceBtn = pageM.locator('button:has-text("Theme"), button:has-text("Тема"), button:has([class*="Palette"])').first();
      if (await appearanceBtn.count() > 0) {
        await appearanceBtn.click();
        await pageM.waitForTimeout(600);
        await screenshot(pageM, 'mobile-settings-appearance', true);

        const mobileSwitch = pageM.locator('[role="switch"]').first();
        if (await mobileSwitch.count() > 0 && await mobileSwitch.isVisible()) {
          await mobileSwitch.click();
          await pageM.waitForTimeout(400);
          const lightInfo = await pageM.evaluate(() => {
            const root = document.querySelector('#root > div');
            if (!root) return null;
            return { theme: root.getAttribute('data-theme'), bg: getComputedStyle(root).backgroundColor };
          });
          results.theme.mobileLight.info = lightInfo;
          await screenshot(pageM, 'mobile-light', true);
        }
      }
    }
  } catch (e) {
    results.error = (results.error || '') + ' | mobile: ' + e.message;
  } finally {
    await mobile.close();
  }

  await fs.promises.writeFile(path.join(outDir, 'app-style-modes-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.error ? 1 : 0);
})();
