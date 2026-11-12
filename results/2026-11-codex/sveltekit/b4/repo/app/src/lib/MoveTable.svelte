<script>
 import {human} from './utils.js';
 let {method,rows}=$props();
 let key=$state(null),direction=$state(1);
 let columns=$derived([...(method==='level-up'?['Level']:[]),'Move','Type','Category','Power','Accuracy','PP']);
 let sorted=$derived(key?[...rows].sort((a,b)=>{const x=a[key],y=b[key];if(x==null)return y==null?0:1;if(y==null)return -1;return direction*(typeof x==='number'?x-y:x.localeCompare(y));}):rows);
 function sort(column){const next=column.toLowerCase();direction=key===next?-direction:1;key=next;}
</script>
<div class="table-scroll"><table class="move-table"><caption>{human(method)}</caption><thead><tr>{#each columns as column (column)}<th aria-sort={key===column.toLowerCase()?(direction===1?'ascending':'descending'):undefined}><button onclick={()=>sort(column)}>{column}</button></th>{/each}</tr></thead><tbody>{#each sorted as row,i (row.name+'-'+row.level+'-'+i)}<tr>{#if method==='level-up'}<td>{row.level}</td>{/if}<td><a href={'/moves/'+row.name}>{row.move}</a></td><td><a class="badge" style:background={'var(--type-'+row.typeName+')'} href={'/types/'+row.typeName}>{row.type}</a></td><td>{row.category}</td><td>{row.power??'—'}</td><td>{row.accuracy??'—'}</td><td>{row.pp??'—'}</td></tr>{/each}</tbody></table></div>
