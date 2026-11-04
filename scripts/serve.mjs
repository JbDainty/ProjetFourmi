import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist'),
  port = Number(process.env.PORT || 8081);
const basePath = (process.env.EXPO_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
};
http
  .createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      if (basePath) {
        if (pathname !== basePath && !pathname.startsWith(basePath + '/')) {
          res.writeHead(404);
          res.end();
          return;
        }
        pathname = pathname.slice(basePath.length) || '/';
      }
      let file = resolve(root, '.' + pathname);
      if (file !== root && !file.startsWith(root + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      try {
        if (!(await stat(file)).isFile()) file = resolve(root, 'index.html');
      } catch {
        if (extname(file)) {
          res.writeHead(404);
          res.end();
          return;
        }
        file = resolve(root, 'index.html');
      }
      res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
      if (file.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
      res.end(await readFile(file));
    } catch {
      res.writeHead(500);
      res.end();
    }
  })
  .listen(port, () => console.log(`Export Web servi sur le port ${port}.`));
