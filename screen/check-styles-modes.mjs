import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname);
const BASE = 'http://localhost:5173/landing/';

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-900', width: 900, height: 1024 },
  { name: 'mobile-600', width: 600, height: 800 },
];

const results = {
  viewports: [],
  tokens: {},
  states: [],
  components: [],
  issues: [],
  screenshots: [],
};

function ss(rel) {
  results.screenshots!.push(rel);
}

async function pageReady(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
}

async function snapshotViewport(page, vp) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await pageReady(page);
  const fname = `layout-${vp.name}.png`;
  await page.screenshot({ path: path.join(outDir, fname), fullPage: true });
  ss(fname);

  const vpEntry = {
    name: vp.name,
    size: { width: vp.width, height: vp.height },
    navVisible: await page.locator('#nav').isVisible().catch(() => false),
    heroVisible: await page.locator('.hero').isVisible().catch(() => false),
    ctaVisible: await page.locator('.hero .btn').first().isVisible().catch(() => false),
    bentoGridCount: await page.locator('.bento .card').count(),
    featuresGridCount: await page.locator('.feat .c').count(),
    listGridCols: await page.locator('.list-grid > *').count(),
    starsCols: await page.locator('.stars > *').count(),
    acCols: await page.locator('.ac-l > *').count(),
    dlCards: await page.locator('.dl .card').count(),
    bg: await page.evaluate(() => {
      const b = getComputedStyle(document.body).backgroundColor;
      return b;
    }),
  };
  results.viewports.push(vpEntry);
}

async function checkTokens(page) {
  const tokens = await page.evaluate(() => {
    const r = document.documentElement.style;
    const cs = getComputedStyle(document.documentElement);
    const keys = ['--black', '--surf', '--surf2', '--bd', '--bd2', '--gold', '--gold-d', '--gold-g', '--cream', '--muted'];
    const out = {};
    for (const k of keys) {
      out[k] = cs.getPropertyValue(k).trim();
    }
    return out;
  });
  results.tokens = tokens;
}

async function checkComponentStates(page) {
  const langBtn = page.locator('#langBtn').first();
  let dropdownVisible = await page.locator('.lang-dropdown').isVisible().catch(() => false);
  results.states.push({ component: 'lang-dropdown', closedVisible: dropdownVisible });
  await langBtn.click();
  await page.waitForTimeout(300);
  dropdownVisible = await page.locator('.lang-dropdown').isVisible().catch(() => false);
  results.states.push({ component: 'lang-dropdown', openVisible: dropdownVisible });
  await page.screenshot({ path: path.join(outDir, 'state-lang-open.png'), fullPage: false });
  ss('state-lang-open.png');
  await page.locator('.lang-opt[data-lang="en"]').first().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);

  const faqFirst = page.locator('.faq dt').first();
  const faqAns = page.locator('.faq dd').first();
  const ansVisibleBefore = await faqAns.isVisible().catch(() => false);
  await faqFirst.click();
  await page.waitForTimeout(300);
  const ansVisibleAfter = await faqAns.isVisible().catch(() => false);
  results.states.push({ component: 'faq-first-item', answerVisibleBefore: ansVisibleBefore, answerVisibleAfter: ansVisibleAfter });
  await page.screenshot({ path: path.join(outDir, 'state-faq-open.png'), fullPage: false });
  ss('state-faq-open.png');

  // Hover effect on Bento card
  const bentoCard = page.locator('[data-tilt]').first();
  const cardVisible = await bentoCard.isVisible().catch(() => false);
  results.components.push({ component: 'bento-card', visible: cardVisible });
  if (cardVisible) {
    await bentoCard.hover();
    await page.waitForTimeout(300);
    const glowAlphaBefore = await page.evaluate(() => {
      const g = document.querySelector('.gl');
      if (!g) return 'missing';
      return getComputedStyle(g).opacity;
    });
    results.components[results.components.length - 1].glowOpacity = glowAlphaBefore;
    await page.screenshot({ path: path.join(outDir, 'state-card-hover.png'), fullPage: false });
    ss('state-card-hover.png');
  }

  // Active nav style on scroll
  await page.evaluate(() => window.scrollTo(0, 120));
  await page.waitForTimeout(400);
  const navBg = await page.evaluate(() => {
    const n = document.getElementById('nav');
    if (!n) return null;
    const s = getComputedStyle(n);
    return { scrolledClass: n.classList.contains('s'), background: s.background, backdropFilter: s.backdropFilter };
  });
  results.states.push({ component: 'nav-scrolled', data: navBg });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    for (const vp of VIEWPORTS) {
      await snapshotViewport(page, vp);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await pageReady(page);
    await checkTokens(page);
    await checkComponentStates(page);

    // Section presence
    const sectionIds = ['nav', 'hero', 'tk', 'stats', 'features', 'comparison', 'security', 'stars', 'ac', 'manifesto', 'faq', 'download', 'mesh', 'footer'];
    results.sections = {};
    for (const s of sectionIds) {
      const el = page.locator(`#${s}`).first();
      results.sections[s] = await el.count() > 0 && await el.isVisible().catch(() => false);
    }
  } catch (e) {
    results.error = e.message;
  } finally {
    await browser.close();
  }

  await fs.promises.writeFile(path.join(outDir, 'style-modes-results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.error ? 1 : 0);
})();
