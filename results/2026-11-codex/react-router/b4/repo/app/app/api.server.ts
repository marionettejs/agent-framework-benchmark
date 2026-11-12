const base=process.env.API_BASE_URL||"http://localhost:9000";
const cache=new Map<string,Promise<any>>();
export function get(path:string):Promise<any>{
 const url=path.startsWith("http")?base+new URL(path).pathname:base+"/api/v2/"+path;
 if(!cache.has(url)) cache.set(url,fetch(url).then(r=>{if(!r.ok)throw new Response("Not found",{status:404});return r.json()}).catch(e=>{cache.delete(url);throw e}));
 return cache.get(url)!;
}
export const id=(r:any)=>Number(r.url.match(/\/(\d+)\/$/)[1]);
export async function types(){return (await get("type/?limit=100")).results.filter((x:any)=>!["stellar","unknown","shadow"].includes(x.name));}
export async function cards(refs:any[]){const ps=await Promise.all(refs.filter(x=>id(x.pokemon||x)<10000).map(async x=>{const p=await get((x.pokemon||x).url);return {id:p.id,name:p.species.name,sprite:p.sprites.front_default,types:p.types,hidden:x.is_hidden}}));return ps.sort((a,b)=>a.id-b.id);}
export async function load(request:Request){
 const u=new URL(request.url); u.pathname=u.pathname.replace(/\/_[.]data$/, "/").replace(/[.]data$/, ""); const parts=u.pathname.split("/").filter(Boolean), name=parts[1], kind=parts[0];
 if(!kind){
 const [species,ts,gs]=await Promise.all([get("pokemon-species/?limit=10000"),types(),get("generation/?limit=100")]);
 let refs=species.results;
 if(u.searchParams.get("type")){const t=await get("type/"+u.searchParams.get("type"));const ids=new Set(t.pokemon.map((x:any)=>id(x.pokemon)));refs=refs.filter((r:any)=>ids.has(id(r)));}
 if(u.searchParams.get("generation")){const g=await get("generation/"+u.searchParams.get("generation"));const names=new Set(g.pokemon_species.map((x:any)=>x.name));refs=refs.filter((r:any)=>names.has(r.name));}
 const q=(u.searchParams.get("q")||"").toLowerCase();refs=refs.filter((r:any)=>r.name.split("-").join(" ").toLowerCase().includes(q)).sort((a:any,b:any)=>id(a)-id(b));
 const count=refs.length,page=Math.max(1,Number(u.searchParams.get("page"))||1);
 return {kind:"home",title:"Pokémon",count,page,ts,gs:await Promise.all(gs.results.map((r:any)=>get(r.url))),cards:await cards(refs.slice((page-1)*48,page*48).map((r:any)=>({url:base+"/api/v2/pokemon/"+id(r)+"/"})))};
 }
 if(kind==="types"&&!name)return {kind:"types",title:"Types",ts:await Promise.all((await types()).map((r:any)=>get(r.url)))};
 if(parts.length!==2||!["pokemon","types","moves","abilities"].includes(kind))throw new Response("",{status:404});
 const resource={pokemon:"pokemon-species",types:"type",moves:"move",abilities:"ability"}[kind];
 const r=await get(resource+"/"+name);
 const title=r.names.find((n:any)=>n.language.name==="en")?.name||r.name;
 if(kind==="pokemon"){
 const p=await get("pokemon/"+r.id),chain=await get(r.evolution_chain.url);
 const games=await Promise.all([...new Set(p.moves.flatMap((m:any)=>m.version_group_details.map((v:any)=>v.version_group.url)))].map((url:any)=>get(url)));
 games.sort((a:any,b:any)=>a.order-b.order);
 const game=u.searchParams.get("game")||games.at(-1)?.name;
 const moves=await Promise.all(p.moves.filter((m:any)=>m.version_group_details.some((v:any)=>v.version_group.name===game)).map(async(m:any)=>({...await get(m.move.url),details:m.version_group_details.filter((v:any)=>v.version_group.name===game)})));
 return {kind,title,r,p,chain:chain.chain,games,game,moves};
 }
 if(kind==="moves")return {kind,title,r,cards:await cards(r.learned_by_pokemon)};
 if(kind==="abilities")return {kind,title,r,cards:await cards(r.pokemon)};
 return {kind,title,r,cards:await cards(r.pokemon)};
}
