const base = process.env.API_BASE_URL || 'http://localhost:9000';
const cache = new Map<string,Promise<any>>();
export function api(path:string):Promise<any> {
 const key=path.startsWith('http') ? new URL(path).pathname+new URL(path).search : '/api/v2/'+path;
 if(!cache.has(key)) cache.set(key,fetch(base+key).then(r=>{if(!r.ok){cache.delete(key);throw new Response('Not found',{status:404});}return r.json()}));
 return cache.get(key)!;
}
export const id=(r:any)=>Number(r.url.match(/\/(\d+)\/?$/)?.[1]);
export const human=(s:string)=>s.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
export const english=(r:any)=>r.names?.find((n:any)=>n.language.name==='en')?.name || human(r.name);
export const flavor=(r:any)=>r.flavor_text_entries?.filter((x:any)=>x.language.name==='en').at(-1)?.flavor_text.replace(/\s+/g,' ') || '—';
export async function types(){const l=await api('type/?limit=100');return Promise.all(l.results.filter((r:any)=>!['stellar','unknown','shadow'].includes(r.name)).map((r:any)=>api(r.url)));}
export async function cards(refs:any[],withTypes=false){
 const list=await api('pokemon-species/?limit=10000'); const names=new Map(list.results.map((r:any)=>[id(r),r.name]));
 return Promise.all(refs.map((r:any)=>({ref:r.pokemon||r,hidden:r.is_hidden})).filter((r:any)=>names.has(id(r.ref))).sort((a:any,b:any)=>id(a.ref)-id(b.ref)).map(async(r:any)=>({id:id(r.ref),name:names.get(id(r.ref)),hidden:r.hidden,sprite:base+'/media/sprites/pokemon/'+id(r.ref)+'.png',types:withTypes?(await api('pokemon/'+id(r.ref)+'/')).types.map((t:any)=>t.type.name):[]})));
}
export async function load(request:Request,params:any){
 const u=new URL(request.url),path=u.pathname.replace(/\.data$/, '').replace(/\/_$/, '/') || '/', q=u.searchParams;
 if(path==='/'){
 const [list,ts,gens]=await Promise.all([api('pokemon-species/?limit=10000'),types(),api('generation/?limit=100')]);
 let refs=list.results;
 if(q.get('q')) refs=refs.filter((r:any)=>human(r.name).toLowerCase().includes(q.get('q')!.toLowerCase()));
 if(q.get('type')) {const t=await api('type/'+q.get('type')+'/'); const ids=new Set(t.pokemon.map((r:any)=>id(r.pokemon)));refs=refs.filter((r:any)=>ids.has(id(r)));}
 if(q.get('generation')){const g=await api('generation/'+q.get('generation')+'/');const ids=new Set(g.pokemon_species.map(id));refs=refs.filter((r:any)=>ids.has(id(r)));}
 refs.sort((a:any,b:any)=>id(a)-id(b)); const count=refs.length,pages=Math.max(1,Math.ceil(count/48)),page=Math.min(pages,Math.max(1,Number(q.get('page'))||1));
 return {kind:'home',title:'Pokémon',types:ts.map((t:any)=>({name:t.name,label:english(t)})),generations:await Promise.all(gens.results.map(async(r:any)=>({name:r.name,label:english(await api(r.url))}))),count,page,pages,cards:await cards(refs.slice((page-1)*48,page*48),true)};
 }
 if(path==='/types')return {kind:'types',title:'Types',types:await types()};
 if(path.startsWith('/pokemon/')&&params.name){
 const s=await api('pokemon-species/'+params.name+'/'),p=await api('pokemon/'+s.id+'/');
 const [chain,groups,ts]=await Promise.all([api(s.evolution_chain.url),api('version-group/?limit=1000'),types()]);
 const groupNames=new Set(p.moves.flatMap((m:any)=>m.version_group_details.map((v:any)=>v.version_group.name)));
 const games=(await Promise.all(groups.results.filter((r:any)=>groupNames.has(r.name)).map((r:any)=>api(r.url)))).sort((a:any,b:any)=>a.order-b.order);
 const game=games.find((g:any)=>g.name===q.get('game'))?.name || games.at(-1)?.name;
 const moves=await Promise.all(p.moves.filter((m:any)=>m.version_group_details.some((v:any)=>v.version_group.name===game)).map(async(m:any)=>({move:await api(m.move.url),details:m.version_group_details.filter((v:any)=>v.version_group.name===game)})));
 return {kind:'pokemon',title:english(s),s,p,chain:chain.chain,games,game,moves,typeNames:Object.fromEntries(ts.map((t:any)=>[t.name,english(t)]))};
 }
 const resource=path.startsWith('/moves/')?'move':path.startsWith('/abilities/')?'ability':path.startsWith('/types/')?'type':null;
 if(resource&&params.name){const r=await api(resource+'/'+params.name+'/');if(resource==='type'&&['stellar','unknown','shadow'].includes(r.name))throw new Response('',{status:404});return {kind:resource,title:english(r),r,cards:await cards(resource==='move'?r.learned_by_pokemon:r.pokemon),typeNames:Object.fromEntries((await types()).map((t:any)=>[t.name,english(t)]))};}
 throw new Response('Not found',{status:404});
}
