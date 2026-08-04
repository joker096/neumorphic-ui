import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Log HTML structure
  const html = await page.evaluate(() => {
    const root = document.querySelector('#root > div');
    if (!root) return 'no root child';
    const aside = root.querySelector('aside');
    const asideHTML = aside ? aside.outerHTML.substring(0, 500) : 'no aside';
    const footer = root.querySelector('footer');
    const footerHTML = footer ? footer.outerHTML.substring(0, 200) : 'no footer';
    const rootBg = getComputedStyle(root).backgroundColor;
    const dataTheme = root.getAttribute('data-theme');
    const bodyChildren = Array.from(document.body.children).map(el => el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : '')).join(', ');
    return {
      dataTheme,
      rootBg,
      bodyChildren,
      aside: aside ? { tag: aside.tagName, class: aside.className, visible: aside.offsetWidth > 0 } : null,
      footer: footer ? { tag: footer.tagName, class: footer.className, visible: footer.offsetWidth > 0 } : null,
      asideHTML,
      footerHTML,
    };
  });

  console.log(JSON.stringify(html, null, 2));
  await browser.close();
})();
