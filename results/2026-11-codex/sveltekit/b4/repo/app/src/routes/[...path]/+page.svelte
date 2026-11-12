<script>
 import {goto} from '$app/navigation';
 import {page} from '$app/state';
 import Cards from '../../lib/Cards.svelte';
 import MoveTable from '../../lib/MoveTable.svelte';
 import {human,dex} from '../../lib/utils.js';
 import '../../lib/tokens.css';
 import '../../lib/app.css';
 let {data}=$props();
 let searchTimer;
 function search(value){clearTimeout(searchTimer);searchTimer=setTimeout(()=>update('q',value),250);}
 function update(key,value){const url=new URL(page.url);if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);if(key!=='game')url.searchParams.delete('page');goto(url.pathname+url.search+url.hash,{keepFocus:true,noScroll:true});}
 function pageLink(n){const p=new URLSearchParams(page.url.search);if(n===1)p.delete('page');else p.set('page',n);return '/'+(p.size?'?'+p:'');}
 const stats=['HP','Attack','Defense','Sp. Atk','Sp. Def','Speed'];
 const relations=[['Super effective against','double_damage_to'],['Not very effective against','half_damage_to'],['No effect against','no_damage_to'],['Weak to','double_damage_from'],['Resists','half_damage_from'],['Immune to','no_damage_from']];
</script>
<svelte:head><title>{data.kind==='home'?'Pokédex':data.title+' – Pokédex'}</title></svelte:head>
{#snippet typeLink(t)}<a class="badge" style:background={'var(--type-'+t.name+')'} href={'/types/'+t.name}>{human(t.name)}</a>{/snippet}
{#snippet evolution(node)}<li><a href={'/pokemon/'+node.species.name}>{human(node.species.name)}</a>{#if node.evolves_to.length}<ul>{#each node.evolves_to as child (child.species.name)}{@render evolution(child)}{/each}</ul>{/if}</li>{/snippet}
<header><div class="header-inner"><a class="brand" href="/">Pokédex</a><nav aria-label="Main"><a href="/">Pokémon</a><a href="/types">Types</a></nav></div></header>
<main>
{#if data.kind==='pokemon'}
<div class="summary"><img class="artwork" src={data.p.sprites.other['official-artwork'].front_default} alt={data.title}/><div><p class="number">{dex(data.s.id)}</p><h1>{data.title}</h1><p class="muted">{data.s.genera.find(g=>g.language.name==='en')?.genus}</p><div class="badges">{#each data.p.types as t (t.slot)}{@render typeLink(t.type)}{/each}</div><dl class="compact"><div><dt>Height</dt><dd>{(data.p.height/10).toFixed(1)} m</dd></div><div><dt>Weight</dt><dd>{(data.p.weight/10).toFixed(1)} kg</dd></div></dl><p>{data.flavor}</p></div></div>
<section aria-labelledby="stats"><h2 id="stats">Base stats</h2><table class="stats"><tbody>{#each data.p.stats as stat,i (stat.stat.name)}<tr><th scope="row">{stats[i]}</th><td>{stat.base_stat}</td><td><div class="track"><div style:width={stat.base_stat/255*100+'%'}></div></div></td></tr>{/each}<tr><th scope="row">Total</th><td>{data.p.stats.reduce((s,x)=>s+x.base_stat,0)}</td><td><div class="track"><div style:width={data.p.stats.reduce((s,x)=>s+x.base_stat,0)/1530*100+'%'}></div></div></td></tr></tbody></table></section>
<section aria-labelledby="abilities"><h2 id="abilities">Abilities</h2><ul>{#each [...data.p.abilities].sort((a,b)=>a.slot-b.slot) as a (a.slot)}<li><a href={'/abilities/'+a.ability.name}>{human(a.ability.name)}</a>{a.is_hidden?' (hidden)':''}</li>{/each}</ul></section>
<section aria-labelledby="evolution"><h2 id="evolution">Evolution</h2><ul>{@render evolution(data.chain)}</ul></section>
<section id="moves" aria-labelledby="moves-heading"><h2 id="moves-heading">Moves</h2><div class="game"><label for="game">Game</label> <select id="game" value={data.game} onchange={e=>update('game',e.currentTarget.value)}>{#each data.versions as v (v)}<option value={v}>{human(v)}</option>{/each}</select></div>{#each data.methods as method (method+data.game)}<MoveTable {method} rows={data.groups[method]}/>{/each}</section>
{:else}
<h1>{data.title}</h1>
{#if data.kind==='home'}
<div class="filters"><div><label for="search">Search</label><input id="search" type="search" value={data.q} oninput={e=>search(e.currentTarget.value)}/></div><div><label for="type">Type</label><select id="type" value={data.type} onchange={e=>update('type',e.currentTarget.value)}><option value="">All types</option>{#each data.types as t (t.name)}<option value={t.name}>{t.label}</option>{/each}</select></div><div><label for="generation">Generation</label><select id="generation" value={data.generation} onchange={e=>update('generation',e.currentTarget.value)}><option value="">All generations</option>{#each data.generations as g (g.name)}<option value={g.name}>{g.label}</option>{/each}</select></div></div>
<p class="count">{data.count} Pokémon</p>{#if data.count}<Cards items={data.items}/>{:else}<p>No Pokémon found</p>{/if}<div class="pagination">{#if data.page>1}<a href={pageLink(data.page-1)}>Previous page</a>{/if}<span>Page {data.page} of {data.pages}</span>{#if data.page<data.pages}<a href={pageLink(data.page+1)}>Next page</a>{/if}</div>
{:else if data.kind==='types'}<ul class="type-list">{#each data.types as t (t.name)}<li><a class="badge" style:background={'var(--type-'+t.name+')'} href={'/types/'+t.name}>{t.label}</a></li>{/each}</ul>
{:else if data.kind==='missing'}<p><a href="/">Back to Pokémon</a></p>
{:else if data.kind==='moves' || data.kind==='abilities'}
{#if data.kind==='moves'}<dl class="details"><div><dt>Type</dt><dd>{@render typeLink(data.r.type)}</dd></div><div><dt>Category</dt><dd>{human(data.r.damage_class.name)}</dd></div>{#each [['Power',data.r.power],['Accuracy',data.r.accuracy],['PP',data.r.pp]] as [label,value] (label)}<div><dt>{label}</dt><dd>{value??'—'}</dd></div>{/each}</dl>{/if}
<section aria-labelledby="effect"><h2 id="effect">Effect</h2><p>{data.effect}</p></section><section aria-labelledby="pokemon"><h2 id="pokemon">{data.kind==='moves'?'Learned by':'Pokémon'}</h2><p class="count">{data.items.length} Pokémon</p><Cards items={data.items}/></section>
{:else if data.kind==='type'}
<section aria-labelledby="relations"><h2 id="relations">Damage relations</h2><dl class="relations">{#each relations as [label,key] (key)}<div><dt>{label}</dt><dd>{#each data.r.damage_relations[key] as t (t.name)}{@render typeLink(t)}{:else}None{/each}</dd></div>{/each}</dl></section>
<section aria-labelledby="pokemon"><h2 id="pokemon">Pokémon</h2><p class="count">{data.items.length} Pokémon</p><Cards items={data.items}/></section>
<section aria-labelledby="type-moves"><h2 id="type-moves">Moves</h2><p class="count">{data.r.moves.length} moves</p><ul class="move-list">{#each [...data.r.moves].sort((a,b)=>human(a.name).localeCompare(human(b.name))) as m (m.name)}<li><a href={'/moves/'+m.name}>{human(m.name)}</a></li>{/each}</ul></section>
{/if}{/if}
</main><footer>Data from PokéAPI. Pokémon and Pokémon character names are trademarks of Nintendo.</footer>
