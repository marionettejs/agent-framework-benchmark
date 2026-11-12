import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
http.createServer(async (req,res) => {
  const pathname = new URL(req.url,'http://localhost').pathname;
  if(pathname === '/config.json') { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({api:process.env.API_BASE_URL || 'http://localhost:9000'})); return; }
  let file = path.resolve(root, '.' + decodeURIComponent(pathname));
  if(!file.startsWith(root + '/')) file = root + '/index.html';
  try { const data = await readFile(file); res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css': 'text/html'); res.end(data); }
  catch { res.setHeader('Content-Type','text/html'); res.end(await readFile(root+'/index.html')); }
}).listen(Number(process.env.PORT || 3000),'0.0.0.0');
