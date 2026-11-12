<script>
 import {human} from './utils.js';
 let {table}=$props();
 let column=$state(null),descending=$state(false);
 let columns=$derived(table.method==='level-up'?['Level','Move','Type','Category','Power','Accuracy','PP']:['Move','Type','Category','Power','Accuracy','PP']);
 const key={Level:'level',Move:'label',Type:'type',Category:'category',Power:'power',Accuracy:'accuracy',PP:'pp'};
 let rows=$derived.by(()=>{if(!column)return table.rows;return [...table.rows].sort((a,b)=>{const x=a[key[column]],y=b[key[column]];if(x==null)return y==null?0:1;if(y==null)return -1;return (typeof x==='number'?x-y:String(x).localeCompare(String(y)))*(descending?-1:1)})});
 function sort(c){if(column===c)descending=!descending;else{column=c;descending=false}}
</script>
<div class="table-scroll"><table class="moves-table"><caption>{human(table.method)}</caption><thead><tr>{#each columns as c (c)}<th aria-sort={column===c?(descending?'descending':'ascending'):undefined}><button onclick={()=>sort(c)}>{c}</button></th>{/each}</tr></thead><tbody>{#each rows as row,i (row.name+'-'+i)}<tr>{#if table.method==='level-up'}<td>{row.level}</td>{/if}<td><a href={'/moves/'+row.name}>{row.label}</a></td><td><a class="badge" style={'--type:var(--type-'+row.type+')'} href={'/types/'+row.type}>{human(row.type)}</a></td><td>{row.category}</td><td>{row.power??'—'}</td><td>{row.accuracy??'—'}</td><td>{row.pp??'—'}</td></tr>{/each}</tbody></table></div>
