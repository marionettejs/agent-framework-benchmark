export const base=(process.env.API_BASE_URL||'http://localhost:9000').replace(/\/$/,'');
const cache=new Map();
export async function api(path){const url=path.startsWith('http')?path:`${base}/api/v2/${path}`;if(!cache.has(url))cache.set(url,fetch(url).then(async r=>{if(!r.ok)throw new Response('Not found',{status:404});return r.json()}).catch(e=>{cache.delete(url);throw e}));return cache.get(url)}
export const id=(r)=>Number(r.url.match(/\/(\d+)\/?$/)?.[1]);
export async function speciesList(){return (await api('pokemon-species/?limit=100000')).results}
export async function types(){return (await api('type/?limit=100')).results.filter(x=>!['stellar','unknown','shadow'].includes(x.name))}
export async function cards(refs,hidden=false){const list=await speciesList();const byId=new Map(list.map(x=>[id(x),x]));return refs.filter(x=>id(x.pokemon||x)<10000).map(x=>{const r=x.pokemon||x;const s=byId.get(id(r));return s?{...s,id:id(s),sprite:`${base}/media/sprites/pokemon/${id(s)}.png`,hidden:hidden&&x.is_hidden}:null}).filter(Boolean).sort((a,b)=>a.id-b.id)}
