import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist/pokedex/browser');
const types = { '.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.ico':'image/x-icon', '.png':'image/png' };
http.createServer(async (req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/config.json') { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({api: process.env.API_BASE_URL || 'http://localhost:9000'})); return; }
  let file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + '/')) file = path.join(root,'index.html');
  try { if (!(await stat(file)).isFile()) throw Error(); } catch { file = path.join(root,'index.html'); }
  try { res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); } catch {res.writeHead(500);res.end('Build unavailable');}
}).listen(Number(process.env.PORT || 3000), '0.0.0.0');
