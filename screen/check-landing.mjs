import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = { buttons: [], issues: [] };

  try {
    await page.goto('http://localhost:5173/landing/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: path.join(outDir, 'landing-full.png'), fullPage: true });
    results.screenshots = ['landing-full.png'];

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    const interactive = [
      { name: 'Language switcher button', selector: '#langBtn' },
      { name: 'Hero CTA button', selector: '.hero .btn' },
      { name: 'Nav CTA button', selector: '.nav-cta' },
      { name: 'FAQ items', selector: '.faq dt' },
      { name: 'Download Windows btn', selector: '.dl .card.mid .btn' },
      { name: 'Download Android btn', selector: '.dl .card:nth-child(2) .btn' },
      { name: 'Download iOS btn', selector: '.dl .card:nth-child(3) .btn' },
      { name: 'Nav link features', selector: 'a[href="#features"]' },
      { name: 'Nav link comparison', selector: 'a[href="#comparison"]' },
      { name: 'Nav link security', selector: 'a[href="#security"]' },
      { name: 'Nav link download', selector: 'a[href="#download"]' },
    ];

    for (const item of interactive) {
      const el = page.locator(item.selector).first();
      const visible = await el.isVisible().catch(() => false);
      results.buttons.push({ name: item.name, selector: item.selector, visible });

      if (visible) {
        try {
          await el.click();
          await page.waitForTimeout(200);
          const fname = `after-${item.name.replace(/\s+/g, '-').toLowerCase()}.png`;
          await page.screenshot({ path: path.join(outDir, fname), fullPage: false });
          results.screenshots = results.screenshots || [];
          results.screenshots.push(fname);
        } catch (e) {
          results.buttons[results.buttons.length - 1].clickError = e.message;
          results.issues.push(`${item.name}: click failed - ${e.message}`);
        }
      } else {
        results.issues.push(`${item.name}: NOT VISIBLE`);
      }
    }

    // Language switcher dropdown test
    await page.locator('#langBtn').click();
    await page.waitForTimeout(200);
    const ruOpt = page.locator('.lang-opt[data-lang="ru"]').first();
    const ruVis = await ruOpt.isVisible().catch(() => false);
    results.langDropdownRU = ruVis;
    if (ruVis) {
      await ruOpt.click();
      await page.waitForTimeout(200);
    }
    const enOpt = page.locator('.lang-opt[data-lang="en"]').first();
    const enVis = await enOpt.isVisible().catch(() => false);
    results.langDropdownEN = enVis;
    if (enVis) {
      await enOpt.click();
      await page.waitForTimeout(200);
    }

    // Re-check all sections visibility after scrolling
    const sections = ['nav', 'hero', 'tk', 'stats', 'features', 'comparison', 'security', 'stars', 'ac', 'manifesto', 'faq', 'download', 'mesh', 'footer'];
    results.sections = {};
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    for (const s of sections) {
      const el = page.locator(`#${s}`).first();
      results.sections[s + '_top'] = await el.isVisible().catch(() => false);
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    for (const s of sections) {
      const el = page.locator(`#${s}`).first();
      results.sections[s + '_bottom'] = await el.isVisible().catch(() => false);
    }
  } catch (e) {
    results.error = e.message;
  } finally {
    await browser.close();
  }

  await fs.promises.writeFile(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.error ? 1 : 0);
})();
