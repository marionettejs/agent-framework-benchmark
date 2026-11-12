import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer(async(req,res)=>{let file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root)) {res.writeHead(403).end();return;}let data;try{data=await fs.readFile(file);}catch{file=path.join(root,'index.html');data=await fs.readFile(file);}res.setHeader('Content-Type',({'html':'text/html','js':'text/javascript','css':'text/css','png':'image/png'})[file.split('.').pop()]||'application/octet-stream');res.end(data);}).listen(Number(process.env.PORT||3000),'0.0.0.0');
