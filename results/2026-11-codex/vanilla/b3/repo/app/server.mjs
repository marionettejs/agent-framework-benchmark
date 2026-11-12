import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/config.js'){res.setHeader('Content-Type','text/javascript');return res.end(`window.API_BASE_URL=${JSON.stringify(process.env.API_BASE_URL||'http://localhost:9000')}`)}const file=pathname.startsWith('/assets/')?path.join(root,pathname):path.join(root,'index.html');const data=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data)}catch{res.writeHead(404);res.end('Not found')}}).listen(Number(process.env.PORT||3000),'0.0.0.0');
