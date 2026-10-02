// Minimal static file server for local audit artifacts.
// Usage: node scripts/static-serve.mjs [rootDir] [port]
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || path.dirname(fileURLToPath(import.meta.url)));
const port = Number(process.argv[3] || process.env.STATIC_PORT || 5196);

const TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const filePath = path.join(root, urlPath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    try {
      const st = statSync(filePath);
      if (st.isDirectory()) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream',
        'Content-Length': st.size,
      });
      createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(404).end('not found');
    }
  })
  .listen(port, () => console.log(`static server on http://localhost:${port} root=${root}`));
