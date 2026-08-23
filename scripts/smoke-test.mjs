import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.br': 'application/octet-stream', '.gz': 'application/octet-stream' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let fp = path.join(ROOT, p);
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end('nf'); return; }
  const ext = path.extname(fp) || '.html';
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/`;

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

const hasApp = await page.evaluate(() => !!document.querySelector('#root') && document.querySelector('#root').children.length > 0);
const title = await page.title();

console.log('Title:', title);
console.log('App mounted (#root has children):', hasApp);
console.log('JS errors:', errors.length);
for (const e of errors) console.log('  -', e);

await browser.close();
server.close();

if (!hasApp || errors.length > 0) {
  console.log('SMOKE TEST: FAIL');
  process.exit(1);
}
console.log('SMOKE TEST: PASS');
