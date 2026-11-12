<script>
 import {human,dex} from './utils.js';
 let {items}=$props();
</script>
<ul class="cards">{#each items as item (item.id)}<li><a href={'/pokemon/'+item.name}><img src={item.sprite} alt={human(item.name)} width="96" height="96"/><span class="number">{dex(item.id)}</span><span>{human(item.name)}</span>{#if item.types}<span class="badges">{#each item.types as type (type.name)}<span class="badge" style:background={'var(--type-'+type.name+')'}>{type.label}</span>{/each}</span>{/if}{#if item.hidden}<small>Hidden ability</small>{/if}</a></li>{/each}</ul>
