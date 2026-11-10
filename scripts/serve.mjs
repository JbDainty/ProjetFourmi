import http from 'node:http';
import { createReadStream } from 'node:fs';
import { mediaRange } from './media-ranges.mjs';
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
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
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
      const size = (await stat(file)).size;
      res.setHeader('Accept-Ranges', 'bytes');
      if (req.headers.range) {
        const range = mediaRange(req.headers.range, size);
        if (!range) {
          res.writeHead(416, { 'Content-Range': `bytes */${size}` });
          res.end();
          return;
        }
        res.writeHead(206, {
          'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
          'Content-Length': range.end - range.start + 1,
        });
        if (req.method === 'HEAD') res.end();
        else createReadStream(file, range).pipe(res);
        return;
      }
      res.setHeader('Content-Length', size);
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      if (file.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
      res.end(await readFile(file));
    } catch {
      res.writeHead(500);
      res.end();
    }
  })
  .listen(port, () => console.log(`Export Web servi sur le port ${port}.`));
