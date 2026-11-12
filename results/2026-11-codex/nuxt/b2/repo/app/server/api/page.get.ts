const cache = new Map<string,Promise<any>>()
const human=(s:string)=>s.split('-').map(x=>x[0]?.toUpperCase()+x.slice(1)).join(' ')
const id=(r:any)=>Number((typeof r==='string'?r:r.url).match(/\/(\d+)\/?$/)?.[1])
const english=(r:any)=>r.names?.find((x:any)=>x.language.name==='en')?.name||human(r.name)
const flavor=(r:any)=>r.flavor_text_entries?.filter((x:any)=>x.language.name==='en').at(-1)?.flavor_text.replace(/\s+/g,' ').trim()||'—'
function get(path:string):Promise<any>{
 const base=process.env.API_BASE_URL||'http://localhost:9000'
 const url=path.startsWith('http')?path:`${base}/api/v2/${path}`
 if(!cache.has(url)) cache.set(url,$fetch(url).catch(e=>{cache.delete(url);throw e}))
 return cache.get(url)!
}
async function species(){return (await get('pokemon-species/?limit=10000')).results.sort((a:any,b:any)=>id(a)-id(b))}
async function cards(refs:any[],types=false){
 const all=await species(); const map=new Map(all.map((s:any)=>[id(s),s.name]))
 return Promise.all(refs.filter((r:any)=>map.has(id(r.pokemon||r))).sort((a:any,b:any)=>id(a.pokemon||a)-id(b.pokemon||b)).map(async(r:any)=>{
 const n=id(r.pokemon||r); const p=types?await get(`pokemon/${n}/`):null
 return {id:n,name:map.get(n),hidden:r.is_hidden,types:p?.types.map((t:any)=>t.type.name),sprite:`${process.env.API_BASE_URL||'http://localhost:9000'}/media/sprites/pokemon/${n}.png`}
 }))
}
export default defineEventHandler(async(event)=>{
 const q=getQuery(event);const path=String(q.path||'/').split('/').filter(Boolean)
 try {
 if(!path.length){
 const [all,tl,gl]=await Promise.all([species(),get('type/?limit=100'),get('generation/?limit=100')])
 const types=await Promise.all(tl.results.filter((r:any)=>!['stellar','unknown','shadow'].includes(r.name)).map((r:any)=>get(r.url)))
 const generations=await Promise.all(gl.results.map((r:any)=>get(r.url)))
 let matches=all.filter((s:any)=>human(s.name).toLowerCase().includes(String(q.q||'').toLowerCase()))
 if(q.type){const t=types.find((t:any)=>t.name===q.type);const ids=new Set(t?.pokemon.map((p:any)=>id(p.pokemon)));matches=matches.filter((s:any)=>ids.has(id(s)))}
 if(q.generation){const g=generations.find((g:any)=>g.name===q.generation);const ids=new Set(g?.pokemon_species.map(id)); matches=matches.filter((s:any)=>ids.has(id(s)))}
 const page=Math.max(1,Number(q.page)||1)
 return {kind:'home',title:'Pokémon',types:types.map((t:any)=>({name:t.name,label:english(t)})),generations:generations.map((g:any)=>({name:g.name,label:english(g)})),count:matches.length,page,pages:Math.max(1,Math.ceil(matches.length/48)),cards:await cards(matches.slice((page-1)*48,page*48),true)}
 }
 if(path[0]==='types'&&path.length===1){const list=await get('type/?limit=100');return {kind:'types',title:'Types',types:await Promise.all(list.results.filter((r:any)=>!['stellar','unknown','shadow'].includes(r.name)).map(async(r:any)=>{const t=await get(r.url);return {name:t.name,label:english(t)}}))}}
 const [kind,name]=path;if(path.length!==2||!['pokemon','moves','abilities','types'].includes(kind))throw Error()
 if(kind==='pokemon'){
 const s=await get(`pokemon-species/${name}/`);const p=await get(`pokemon/${s.id}/`)
 const chain=await get(s.evolution_chain.url)
 const games=await Promise.all([...new Set(p.moves.flatMap((m:any)=>m.version_group_details.map((d:any)=>d.version_group.url)))].map((url:any)=>get(url)))
 games.sort((a:any,b:any)=>a.order-b.order)
 const game=games.find((g:any)=>g.name===q.game)||games.at(-1)
 const rows=(await Promise.all(p.moves.map(async(m:any)=>{
 const details=m.version_group_details.filter((d:any)=>d.version_group.name===game?.name);if(!details.length)return []
 const move=await get(m.move.url);return details.map((d:any)=>({method:d.move_learn_method.name,level:d.level_learned_at,name:move.name,label:english(move),type:move.type.name,category:human(move.damage_class.name),power:move.power,accuracy:move.accuracy,pp:move.pp}))
 }))).flat()
 return {kind,title:english(s),id:s.id,genus:s.genera.find((g:any)=>g.language.name==='en')?.genus,flavor:flavor(s),pokemon:p,chain:chain.chain,games:games.map((g:any)=>g.name),game:game?.name,rows}
 }
 const r=await get(`${{moves:'move',abilities:'ability',types:'type'}[kind]}/${name}/`)
 const effect=r.effect_entries?.find((e:any)=>e.language.name==='en')?.short_effect||flavor(r)
 return {kind,title:english(r),resource:r,effect,cards:await cards(kind==='moves'?r.learned_by_pokemon: r.pokemon)}
 }catch{return {kind:'missing',title:'Not found'}}
})
