<script>
let {method,rows}=$props();let sort=$state(''),descending=$state(false);
const cols=$derived(method==='level-up'?['Level','Move','Type','Category','Power','Accuracy','PP']:['Move','Type','Category','Power','Accuracy','PP']);
const value=(r,c)=>({Level:r.level,Move:r.name,Type:r.type,Category:r.category,Power:r.power,Accuracy:r.accuracy,PP:r.pp}[c]);
let ordered=$derived([...rows].sort((a,b)=>{if(!sort)return (method==='level-up'?a.level-b.level:0)||a.name.localeCompare(b.name);const av=value(a,sort),bv=value(b,sort);if(av==null)return bv==null?0:1;if(bv==null)return -1;return (typeof av==='number'?av-bv:String(av).localeCompare(String(bv)))*(descending?-1:1);}));
const human=s=>s.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
</script>
<div class="table-scroll"><table class="moves-table"><caption>{human(method)}</caption><thead><tr>{#each cols as col (col)}<th aria-sort={sort===col?(descending?'descending':'ascending'):undefined}><button onclick={()=>{descending=sort===col?!descending:false;sort=col;}}>{col}</button></th>{/each}</tr></thead><tbody>{#each ordered as r (r.id)}<tr>{#each cols as col (col)}<td>{#if col==='Move'}<a href={'/moves/'+r.slug}>{r.name}</a>{:else if col==='Type'}<a class="badge" style:background={`var(--type-${r.type})`} href={'/types/'+r.type}>{human(r.type)}</a>{:else}{value(r,col)??'—'}{/if}</td>{/each}</tr>{/each}</tbody></table></div>
