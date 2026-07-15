import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

const htmlClass = await page.evaluate(() => document.documentElement.className);
console.log('HTML class:', JSON.stringify(htmlClass));

const rootHTML = await page.evaluate(() => {
  const root = document.getElementById('root');
  if (!root) return 'no root';
  const firstChild = root.firstElementChild;
  return firstChild?.outerHTML?.substring(0, 2000) || 'no child';
});
console.log('Root HTML:', rootHTML);

const dataTheme = await page.evaluate(() => document.querySelector('[data-theme]')?.getAttribute('data-theme') || 'none');
console.log('data-theme:', dataTheme);

const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(b => ({
    text: (b.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 100),
    ariaLabel: b.getAttribute('aria-label') || '',
    visible: b.offsetParent !== null,
  }));
});
console.log('All buttons:', JSON.stringify(buttons, null, 2));

const sidebarText = await page.evaluate(() => {
  const sidebar = document.querySelector('nav') || document.querySelector('[class*="sidebar"]') || document.querySelector('[class*="Sidebar"]');
  return sidebar ? (sidebar.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 500) : 'no sidebar found';
});
console.log('Sidebar text:', sidebarText);

await browser.close();
