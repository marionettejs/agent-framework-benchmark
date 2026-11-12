import {id,english,flavor,human} from './utils.js';
const cache=new Map();
export function api(path){
 const base=process.env.API_BASE_URL || 'http://localhost:9000';
 const url=path.startsWith('http')?path:`${base}/api/v2/${path}`;
 if(!cache.has(url)) cache.set(url,fetch(url).then(r=>{if(!r.ok)throw Error('Not found');return r.json()}).catch(e=>{cache.delete(url);throw e}));
 return cache.get(url);
}
export const list=async resource=>(await api(`${resource}/?limit=10000`)).results;
export async function cards(refs,withTypes=false){
 const species=await list('pokemon-species');
 const map=new Map(species.map(s=>[id(s),s]));
 return Promise.all(refs.map(r=>({ref:r.pokemon||r,hidden:r.is_hidden})).filter(r=>map.has(id(r.ref))).sort((a,b)=>id(a.ref)-id(b.ref)).map(async r=>{
 const n=id(r.ref),s=map.get(n); const p=withTypes?await api(`pokemon/${n}/`):null;
 return {id:n,name:s.name,hidden:r.hidden,sprite:p?.sprites.front_default||`${process.env.API_BASE_URL||'http://localhost:9000'}/media/sprites/pokemon/${n}.png`,types:p?.types.sort((a,b)=>a.slot-b.slot).map(t=>t.type.name)};
 }));
}
export async function loadPage(url){
 const parts=url.pathname.split('/').filter(Boolean),kind=parts[0],name=parts[1];
 if(!kind){
 const [species,types,gens]=await Promise.all([list('pokemon-species'),list('type'),list('generation')]);
 const validTypes=types.filter(t=>!['stellar','unknown','shadow'].includes(t.name));
 let matches=species.filter(s=>human(s.name).toLowerCase().includes((url.searchParams.get('q')||'').toLowerCase()));
 const type=url.searchParams.get('type'),gen=url.searchParams.get('generation');
 if(type){const t=await api(`type/${type}/`);const ids=new Set(t.pokemon.map(p=>id(p.pokemon)));matches=matches.filter(s=>ids.has(id(s)))}
 if(gen){const g=await api(`generation/${gen}/`);const ids=new Set(g.pokemon_species.map(id));matches=matches.filter(s=>ids.has(id(s)))}
 matches.sort((a,b)=>id(a)-id(b));const pages=Math.max(1,Math.ceil(matches.length/48)),page=Math.min(pages,Math.max(1,Number(url.searchParams.get('page'))||1));
 return {kind:'home',title:'Pokémon',types:await Promise.all(validTypes.map(t=>api(t.url).then(r=>({name:r.name,label:english(r)})))),gens:await Promise.all(gens.map(g=>api(g.url).then(r=>({name:r.name,label:english(r)})))),cards:await cards(matches.slice((page-1)*48,page*48),true),count:matches.length,page,pages};
 }
 if(kind==='types'&&!name&&parts.length===1){const refs=await list('type');return {kind:'types',title:'Types',types:await Promise.all(refs.filter(t=>!['stellar','unknown','shadow'].includes(t.name)).map(t=>api(t.url).then(r=>({name:r.name,label:english(r)}))))}}
 if(parts.length!==2||!['pokemon','moves','abilities','types'].includes(kind))throw Error();
 if(kind==='pokemon'){
 const s=await api(`pokemon-species/${name}/`),p=await api(`pokemon/${s.id}/`),chain=await api(s.evolution_chain.url);
 const groupNames=[...new Set(p.moves.flatMap(m=>m.version_group_details.map(v=>v.version_group.name)))];
 const games=(await Promise.all(groupNames.map(g=>api(`version-group/${g}/`)))).sort((a,b)=>a.order-b.order).map(g=>({name:g.name,label:human(g.name)}));
 const game=games.some(g=>g.name===url.searchParams.get('game'))?url.searchParams.get('game'):games.at(-1)?.name;
 const rows=await Promise.all(p.moves.filter(m=>m.version_group_details.some(v=>v.version_group.name===game)).map(async m=>{const move=await api(m.move.url);return {name:move.name,label:english(move),type:move.type.name,category:human(move.damage_class.name),power:move.power,accuracy:move.accuracy,pp:move.pp,details:m.version_group_details.filter(v=>v.version_group.name===game)}}));
 const methods=[...new Set(rows.flatMap(r=>r.details.map(d=>d.move_learn_method.name)))].sort((a,b)=>{const order=['level-up','machine','egg','tutor'];return (order.includes(a)?order.indexOf(a):4)-(order.includes(b)?order.indexOf(b):4)||a.localeCompare(b)});
 return {kind,title:english(s),s,p,chain:chain.chain,games,game,flavor:flavor(s),tables:methods.map(method=>({method,rows:rows.flatMap(r=>r.details.filter(d=>d.move_learn_method.name===method).map(d=>({...r,level:d.level_learned_at}))).sort((a,b)=>(method==='level-up'?a.level-b.level:0)||a.label.localeCompare(b.label))}))};
 }
 const resource={moves:'move',abilities:'ability',types:'type'}[kind],r=await api(`${resource}/${name}/`);
 return {kind:kind==='types'?'type':kind,title:english(r),r,effect:r.effect_entries?.find(e=>e.language.name==='en')?.short_effect||flavor(r),cards:await cards(kind==='moves'?r.learned_by_pokemon:r.pokemon)};
}
