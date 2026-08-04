import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // List all buttons in sidebar
  const buttons = await page.evaluate(() => {
    const outerAside = document.querySelector('aside');
    // The outer aside wraps another aside
    const innerAside = outerAside ? outerAside.querySelector('aside') : null;
    if (!innerAside) {
      return { error: 'no inner aside', outerHTML: outerAside ? outerAside.outerHTML.substring(0, 300) : 'no outer aside' };
    }
    const nav = innerAside.querySelector('nav');
    if (!nav) return { error: 'no nav' };
    const buttons = nav.querySelectorAll('button');
    return {
      buttonCount: buttons.length,
      buttons: Array.from(buttons).map((btn, i) => ({
        index: i,
        text: btn.textContent?.trim(),
        classes: btn.className,
        children: Array.from(btn.children).map(c => c.tagName + (c.className ? '.' + c.className.split(' ')[0] : '')).join(', '),
      })),
    };
  });

  console.log(JSON.stringify(buttons, null, 2));
  await browser.close();
})();
