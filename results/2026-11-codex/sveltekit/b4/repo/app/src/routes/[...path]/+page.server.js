import { human, english, flavor, id } from '../../lib/utils.js';
const cache = new Map();
async function api(path) {
 const base=process.env.API_BASE_URL || 'http://localhost:9000';
 const url=path.startsWith('http')?path:base+'/api/v2/'+path;
 if(!cache.has(url)) cache.set(url,fetch(url).then(r=>{if(!r.ok) throw new Error('Not found');return r.json();}).catch(e=>{cache.delete(url);throw e;}));
 return cache.get(url);
}
async function catalog(){
 const [species,tl,gl]=await Promise.all(['pokemon-species/?limit=10000','type/?limit=100','generation/?limit=100'].map(api));
 const [types,generations]=await Promise.all([Promise.all(tl.results.filter(x=>!['stellar','shadow','unknown'].includes(x.name)).map(x=>api(x.url))),Promise.all(gl.results.map(x=>api(x.url)))]);
 return {species:species.results,types,generations};
}
async function cards(refs){
 const species=(await api('pokemon-species/?limit=10000')).results;
 const byId=new Map(species.map(s=>[id(s),s]));
 return refs.map(r=>({...r,id:id(r.pokemon || r)})).filter(r=>byId.has(r.id)).sort((a,b)=>a.id-b.id).map(r=>({id:r.id,name:byId.get(r.id).name,hidden:r.is_hidden,sprite:(process.env.API_BASE_URL || 'http://localhost:9000')+'/media/sprites/pokemon/'+r.id+'.png'}));
}
export async function load({params,url}) {
 const parts=(params.path||'').split('/').filter(Boolean);
 try {
 if(!parts.length){
 const c=await catalog();let list=c.species;
 const q=url.searchParams.get('q')||'',type=url.searchParams.get('type')||'',generation=url.searchParams.get('generation')||'';
 if(q)list=list.filter(s=>human(s.name).toLowerCase().includes(q.toLowerCase()));
 if(type){const ids=new Set(c.types.find(t=>t.name===type)?.pokemon.map(p=>id(p.pokemon)));list=list.filter(s=>ids.has(id(s)));}
 if(generation){const ids=new Set(c.generations.find(g=>g.name===generation)?.pokemon_species.map(id));list=list.filter(s=>ids.has(id(s)));}
 list.sort((a,b)=>id(a)-id(b));const count=list.length,pages=Math.max(1,Math.ceil(count/48)),page=Math.min(pages,Math.max(1,Number(url.searchParams.get('page'))||1));
 const items=await cards(list.slice((page-1)*48,page*48));
 for(const item of items)item.types=c.types.filter(t=>t.pokemon.some(p=>id(p.pokemon)===item.id)).sort((a,b)=>a.pokemon.find(p=>id(p.pokemon)===item.id).slot-b.pokemon.find(p=>id(p.pokemon)===item.id).slot).map(t=>({name:t.name,label:english(t)}));
 return {kind:'home',title:'Pokémon',items,count,pages,page,q,type,generation,types:c.types.map(t=>({name:t.name,label:english(t)})),generations:c.generations.map(g=>({name:g.name,label:english(g)}))};
 }
 if(parts[0]==='types'&&parts.length===1){const c=await catalog();return {kind:'types',title:'Types',types:c.types.map(t=>({name:t.name,label:english(t)}))};}
 if(parts.length!==2)throw new Error();
 const [kind,name]=parts;
 if(kind==='pokemon'){
 const s=await api('pokemon-species/'+name+'/');const p=await api('pokemon/'+s.id+'/');
 const [chain,versions,moves]=await Promise.all([api(s.evolution_chain.url),Promise.all([...new Set(p.moves.flatMap(m=>m.version_group_details.map(v=>v.version_group.url)))].map(api)),Promise.all(p.moves.map(m=>api(m.move.url)))]);
 versions.sort((a,b)=>a.order-b.order);const game=versions.find(v=>v.name===url.searchParams.get('game'))?.name || versions.at(-1)?.name;
 const groups={};
 p.moves.forEach((entry,i)=>entry.version_group_details.filter(v=>v.version_group.name===game).forEach(v=>{const m=moves[i],method=v.move_learn_method.name;const row={level:v.level_learned_at,name:m.name,move:english(m),type:human(m.type.name),typeName:m.type.name,category:human(m.damage_class.name),power:m.power,accuracy:m.accuracy,pp:m.pp};(groups[method] ||= []).push(row);}));
 const rank=['level-up','machine','egg','tutor'];const methods=Object.keys(groups).sort((a,b)=>(rank.includes(a)?rank.indexOf(a):4)-(rank.includes(b)?rank.indexOf(b):4)||a.localeCompare(b));
 for(const method of methods)groups[method].sort((a,b)=>(method==='level-up'?a.level-b.level:0)||a.move.localeCompare(b.move));
 return {kind,title:english(s),s,p,chain:chain.chain,versions:versions.map(v=>v.name),game,groups,methods,flavor:flavor(s)};
 }
 if(kind==='moves') {const r=await api('move/'+name+'/');return {kind,title:english(r),r,effect:r.effect_entries.find(e=>e.language.name==='en')?.short_effect || flavor(r),items:await cards(r.learned_by_pokemon)};}
 if(kind==='abilities'){const r=await api('ability/'+name+'/');return {kind,title:english(r),r,effect:r.effect_entries.find(e=>e.language.name==='en')?.short_effect || '—',items:await cards(r.pokemon)};}
 if(kind==='types'&&!['stellar','shadow','unknown'].includes(name)){const r=await api('type/'+name+'/');return {kind:'type',title:english(r),r,items:await cards(r.pokemon)};}
 throw new Error();
 }catch{return {kind:'missing',title:'Not found'};}
}
