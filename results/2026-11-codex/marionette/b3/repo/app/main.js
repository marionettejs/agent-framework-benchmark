import { View, Region, CollectionView, setDomApi, setDataApi } from 'marionette';
import { Collection, DataApi } from '@mnjs/data';
import HtmlDomApi from '@mnjs/html/marionette';
import { html } from '@mnjs/html';
import { get, all, catalog, cardRecords, typeResources, idOf, human, english, flavor, effect, origin } from './api.js';
import './style.css';
setDomApi(HtmlDomApi); setDataApi(DataApi);
const badge = (t,linked=true) => linked ? html`<a class="badge" style=${`--badge:var(--type-${t.name})`} href=${`/types/${t.name}`}>${human(t.name)}</a>` : html`<span class="badge" style=${`--badge:var(--type-${t.name})`}>${human(t.name)}</span>`;
const section = (name,body,id=name.toLowerCase().replaceAll(' ','-')) => html`<section id=${id} aria-labelledby=${id+'-heading'}><h2 id=${id+'-heading'}>${name}</h2>${body}</section>`;
const dex = id => '#'+String(id).padStart(4,'0');
const value = n => n ?? '—';
const Card = View.extend({tagName:'li', template: d=>html`<a class="card" href=${'/pokemon/'+d.name}><img src=${`${origin}/media/sprites/pokemon/${d.id}.png`} alt=""><span class="dex">${dex(d.id)}</span><span>${human(d.name)}</span>${d.types?html`<span>${d.types.map(t=>badge(t.type,false))}</span>`:''}${d.hidden?html`<span class="hidden">Hidden ability</span>`:''}</a>`});
const Cards = CollectionView.extend({tagName:'ul',className:'cards',childView:Card});
const Layout=View.extend({template:()=>html`<header><div class="header-inner"><a class="brand" href="/">Pokédex</a><nav><a href="/">Pokémon</a><a href="/types">Types</a></nav></div></header><main></main><footer>Data from PokéAPI. Pokémon and Pokémon character names are trademarks of Nintendo.</footer>`,regions:{page:'main'}});
const layout = new Layout(); new Region({el:'#app'}).show(layout);
function showCards(view,records) {view.showChildView('cards',new Cards({collection:new Collection(records)}));}
const params = () => new URLSearchParams(location.search);
function setQuery(key,val,reset=false) {const p=params(); if(val)p.set(key,val);else p.delete(key);if(reset)p.delete('page'); history.pushState({},'',location.pathname+(p.size?'?'+p:'')+location.hash);}
const Home=View.extend({
 initialize(options){Object.assign(this,options);this.revision=0;},
 templateContext(){return {types:this.types,generations:this.generations};},
 template:({types,generations})=>html`<h1>Pokémon</h1><div class="filters"><label>Search<input type="search" name="q" .value=${params().get('q')||''}></label><div><label for="type-filter">Type</label><select id="type-filter" name="type"><option value="">All types</option>${types.map(t=>html`<option value=${t.name} ?selected=${params().get('type')===t.name}>${english(t)}</option>`)}</select></div><div><label for="generation-filter">Generation</label><select id="generation-filter" name="generation"><option value="">All generations</option>${generations.map(g=>html`<option value=${g.name} ?selected=${params().get('generation')===g.name}>${english(g)}</option>`)}</select></div></div><div class="results"></div>`,
 regions:{results:'.results'}, events:{'input input':'filter','change select':'filter'},
 filter(e){setQuery(e.delegateTarget.name,e.delegateTarget.value,true);this.refresh().catch(report);},
 async refresh(){const rev=++this.revision;const p=params();let records=this.species.filter(s=>human(s.name).toLowerCase().includes((p.get('q')||'').toLowerCase()));
 if(p.get('type')){const t=await get(`type/${p.get('type')}/`);const ids=new Set(t.pokemon.map(p=>idOf(p.pokemon)));records=records.filter(s=>ids.has(s.id));}
 if(p.get('generation')){const g=await get(`generation/${p.get('generation')}/`);const ids=new Set(g.pokemon_species.map(idOf));records=records.filter(s=>ids.has(s.id));}
 const total=records.length;const pages=Math.max(1,Math.ceil(total/48));const page=Math.max(1,Math.min(Number(p.get('page')||1),pages));
 const rows=await Promise.all(records.slice((page-1)*48,page*48).map(async s=>({...s,types:(await get(`pokemon/${s.id}/`)).types})));
 if(this.isDestroyed()||rev!==this.revision)return;
 const pageLink=n=>{const q=new URLSearchParams(p);if(n===1)q.delete('page');else q.set('page',n);return '/'+(q.size?'?'+q:'');};
 const Results=View.extend({template:()=>html`<p class="count">${total} Pokémon</p>${total?html`<div class="card-slot"></div>`:html`<p>No Pokémon found</p>`}<div class="pagination">${page>1?html`<a href=${pageLink(page-1)}>Previous page</a>`:''}<span>Page ${page} of ${pages}</span>${page<pages?html`<a href=${pageLink(page+1)}>Next page</a>`:''}</div>`,regions:{cards:'.card-slot'}});
 const result=new Results();this.showChildView('results',result);if(total)showCards(result,rows);
 }
});
const Moves=View.extend({
 initialize(o){Object.assign(this,o);this.sorts={};this.game=params().get('game')||this.games.at(-1)?.name;},
 templateContext(){return {owner:this};},
 template:({owner:v})=>html`<div class="game"><label for="game-select">Game</label><select id="game-select">${v.games.map(g=>html`<option value=${g.name} ?selected=${g.name===v.game}>${human(g.name)}</option>`)}</select></div>${v.tables().map(t=>v.tableTemplate(t))}`,
 events:{'change select':'changeGame','click th':'sort'},
 changeGame(e){this.game=e.delegateTarget.value;this.sorts={};setQuery('game',this.game);this.render();},
 sort(e){const {method,key}=e.delegateTarget.dataset;const old=this.sorts[method];this.sorts[method]={key,desc:old?.key===key?!old.desc:false};this.render();},
 tables(){const methods=new Map();for(const entry of this.pokemon.moves){for(const detail of entry.version_group_details.filter(d=>d.version_group.name===this.game)){const method=detail.move_learn_method.name; if(!methods.has(method))methods.set(method,[]); const m=this.moveData.get(entry.move.name);methods.get(method).push({level:detail.level_learned_at,move:english(m),type:human(m.type.name),category:human(m.damage_class.name),power:m.power,accuracy:m.accuracy,pp:m.pp,data:m});}}
 const priority=['level-up','machine','egg','tutor'];const rank=n=>priority.includes(n)?priority.indexOf(n):4;
 return [...methods].sort((a,b)=>rank(a[0])-rank(b[0])||a[0].localeCompare(b[0])).map(([name,rows])=>{const sort=this.sorts[name]||{key:name==='level-up'?'level':'move',desc:false};rows.sort((a,b)=>{let x=a[sort.key],y=b[sort.key];if(x==null)return y==null?0:1;if(y==null)return -1;return (typeof x==='number'?x-y:x.localeCompare(y))*(sort.desc?-1:1)||a.move.localeCompare(b.move);});return {name,rows};});},
 tableTemplate({name,rows}){const keys=[...(name==='level-up'?['level']:[]),'move','type','category','power','accuracy','pp'];const sort=this.sorts[name];return html`<div class="table-scroll"><table class="moves-table"><caption>${human(name)}</caption><thead><tr>${keys.map(k=>html`<th data-method=${name} data-key=${k} aria-sort=${sort?.key===k?(sort.desc?'descending':'ascending'):'none'}><button data-method=${name} data-key=${k}>${k==='pp'?'PP':human(k)}</button></th>`)}</tr></thead><tbody>${rows.map(r=>html`<tr>${keys.map(k=>html`<td>${k==='move'?html`<a href=${'/moves/'+r.data.name}>${r.move}</a>`:k==='type'?badge(r.data.type):value(r[k])}</td>`)}</tr>`)}</tbody></table></div>`;}
});
const evolve = chain => html`<li><a href=${'/pokemon/'+chain.species.name}>${human(chain.species.name)}</a>${chain.evolves_to.length?html`<ul>${chain.evolves_to.map(evolve)}</ul>`:''}</li>`;
async function pokemonPage(name){const s=await get(`pokemon-species/${name}/`);const p=await get(`pokemon/${s.id}/`);const [chain,moveData,games]=await Promise.all([get(s.evolution_chain.url),Promise.all(p.moves.map(m=>get(m.move.url))),Promise.all([...new Set(p.moves.flatMap(m=>m.version_group_details.map(d=>d.version_group.name)))].map(n=>get(`version-group/${n}/`)))]);
 games.sort((a,b)=>a.order-b.order);const labels=['HP','Attack','Defense','Sp. Atk','Sp. Def','Speed'];const stats=p.stats.map((s,i)=>[labels[i],s.base_stat]);stats.push(['Total',p.stats.reduce((n,s)=>n+s.base_stat,0)]);
 const Page=View.extend({template:()=>html`<div class="summary"><img class="artwork" src=${p.sprites.other['official-artwork'].front_default} alt=${english(s)}><div><span class="dex">${dex(s.id)}</span><h1>${english(s)}</h1><p class="genus">${s.genera.find(g=>g.language.name==='en')?.genus}</p><p>${p.types.map(t=>badge(t.type))}</p><dl class="measurements"><div><dt>Height</dt><dd>${(p.height/10).toFixed(1)} m</dd></div><div><dt>Weight</dt><dd>${(p.weight/10).toFixed(1)} kg</dd></div></dl><p>${flavor(s)}</p></div></div>${section('Base stats',html`<table class="stats"><tbody>${stats.map(([label,n])=>html`<tr><th scope="row">${label}</th><td>${n}</td><td><div class="track"><div style=${`width:${n/(label==='Total'?720:255)*100}%`}></div></div></td></tr>`)}</tbody></table>`)}${section('Abilities',html`<ul>${p.abilities.map(a=>html`<li><a href=${'/abilities/'+a.ability.name}>${human(a.ability.name)}</a>${a.is_hidden?' (hidden)':''}</li>`)}</ul>`)}${section('Evolution',html`<ul>${evolve(chain.chain)}</ul>`)}${section('Moves',html`<div class="move-slot"></div>`)}`,regions:{moves:'.move-slot'}});
 const view=new Page();mount(view,english(s));view.showChildView('moves',new Moves({pokemon:p,games,moveData:new Map(moveData.map(m=>[m.name,m]))}));
 if(location.hash==='#moves')requestAnimationFrame(()=>document.getElementById('moves').scrollIntoView());
}
function mount(view,title){document.title=location.pathname==='/'?'Pokédex':`${title} – Pokédex`;layout.showChildView('page',view);}
async function details(kind,name){const endpoint={moves:'move',abilities:'ability',types:'type'}[kind];const d=await get(`${endpoint}/${name}/`);if(kind==='types'&&['stellar','unknown','shadow'].includes(name))throw Object.assign(new Error(),{status:404});
 const entries=kind==='moves'?d.learned_by_pokemon:d.pokemon;const records=await cardRecords(entries);
 const related=kind==='moves'?html`<dl class="details"><div><dt>Type</dt><dd>${badge(d.type)}</dd></div>${[['Category',human(d.damage_class.name)],['Power',value(d.power)],['Accuracy',value(d.accuracy)],['PP',value(d.pp)]].map(([k,v])=>html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`:'';
 const relations=[['Super effective against','double_damage_to'],['Not very effective against','half_damage_to'],['No effect against','no_damage_to'],['Weak to','double_damage_from'],['Resists','half_damage_from'],['Immune to','no_damage_from']];
 const Page=View.extend({template:()=>html`<h1>${english(d)}</h1>${related}${kind==='types'?section('Damage relations',html`<dl class="relations">${relations.map(([label,key])=>html`<div><dt>${label}</dt><dd>${d.damage_relations[key].length?d.damage_relations[key].map(t=>badge(t)):'None'}</dd></div>`)}</dl>`):section('Effect',html`<p>${effect(d)}</p>`)}${section(kind==='moves'?'Learned by':'Pokémon',html`<p class="count">${records.length} Pokémon</p><div class="card-slot"></div>`)}${kind==='types'?section('Moves',html`<p class="count">${d.moves.length} moves</p><ul class="move-links">${[...d.moves].sort((a,b)=>a.name.localeCompare(b.name)).map(m=>html`<li><a href=${'/moves/'+m.name}>${human(m.name)}</a></li>`)}</ul>`):''}`,regions:{cards:'.card-slot'}});const view=new Page();mount(view,english(d));showCards(view,records);
}
function report(e){console.error(e);const title=e.status===404?'Not found':'Unable to load';mount(new View({template:()=>html`<h1>${title}</h1><p>${e.status===404?'The page you are looking for could not be found.':'Please try again.'}</p><a href="/">Back to Pokémon</a>`}),title);}
async function route(){try {const path=location.pathname;if(path==='/'){const [species,types,generations]=await Promise.all([catalog(),typeResources(),all('generation').then(gs=>Promise.all(gs.map(g=>get(g.url))))]);const home=new Home({species,types,generations});mount(home,'Pokémon');await home.refresh();return;}
 if(path==='/types'){const types=await typeResources();mount(new View({template:()=>html`<h1>Types</h1><ul class="type-grid">${types.map(t=>html`<li><a style=${`background:var(--type-${t.name})`} href=${'/types/'+t.name}>${english(t)}</a></li>`)}</ul>`}),'Types');return;}
 const match=path.match(/^\/(pokemon|moves|abilities|types)\/([^/]+)\/?$/);if(!match)throw Object.assign(new Error(),{status:404});if(match[1]==='pokemon')await pokemonPage(match[2]);else await details(match[1],match[2]);
 }catch(e){report(e);}}
window.addEventListener('popstate',()=>route());
await route();
