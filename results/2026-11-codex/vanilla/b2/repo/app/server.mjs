import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer(async(req,res)=>{let p=new URL(req.url,'http://localhost').pathname;if(p==='/config.js'){res.setHeader('Content-Type','application/javascript');return res.end(`window.API_BASE_URL=${JSON.stringify(process.env.API_BASE_URL||'http://localhost:9000')}`)}try{const file=p.startsWith('/assets/')?path.join(root,path.basename(path.dirname(p)),path.basename(p)):path.join(root,'index.html');const data=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data)}catch{res.writeHead(404);res.end()}}).listen(Number(process.env.PORT||3000));
