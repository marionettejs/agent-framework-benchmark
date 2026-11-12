import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist/pokedex/browser');
const mime = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (pathname === '/config.js') {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(
          `window.API_BASE_URL=${JSON.stringify(process.env.API_BASE_URL || 'http://localhost:9000')}`,
        );
        return;
      }
      let file = path.join(root, pathname);
      if (!file.startsWith(root)) throw Error();
      try {
        if (!(await fs.stat(file)).isFile()) file = path.join(root, 'index.html');
      } catch {
        file = path.join(root, 'index.html');
      }
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
      res.end(await fs.readFile(file));
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  })
  .listen(process.env.PORT || 3000);
