import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
http.createServer(async (req,res) => {
  if (req.url === '/config.json') { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({api:process.env.API_BASE_URL || 'http://localhost:9000'})); return; }
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  try {
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + '/')) throw Error();
    const body = await readFile(target);
    res.setHeader('Content-Type', target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css': 'text/html'); res.end(body);
  } catch { res.setHeader('Content-Type','text/html'); res.end(await readFile(path.join(root,'index.html'))); }
}).listen(Number(process.env.PORT || 3000),'0.0.0.0');
