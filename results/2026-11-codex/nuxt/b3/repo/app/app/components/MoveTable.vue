<script setup>
const props=defineProps({method:String,rows:Array});const sort=ref('');const descending=ref(false)
const columns=computed(()=>[...(props.method==='level-up'?['Level']:[]),'Move','Type','Category','Power','Accuracy','PP'])
const value=(r,c)=>({Level:r.level,Move:r.name,Type:r.type,Category:r.category,Power:r.power,Accuracy:r.accuracy,PP:r.pp})[c]
const sorted=computed(()=>[...props.rows].sort((a,b)=>{const c=sort.value;if(!c)return props.method==='level-up'?(a.level-b.level||a.name.localeCompare(b.name)):a.name.localeCompare(b.name);const x=value(a,c),y=value(b,c);if(x==null)return y==null?0:1;if(y==null)return -1;return (typeof x==='number'?x-y:x.localeCompare(y))*(descending.value?-1:1)}))
function change(c){descending.value=sort.value===c?!descending.value:false;sort.value=c}
const human=s=>s.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')
</script>
<template><div class="table-wrap"><table class="moves-table"><caption>{{human(method)}}</caption><thead><tr><th v-for="c in columns" :aria-sort="sort===c?(descending?'descending':'ascending'):undefined"><button @click="change(c)">{{c}}</button></th></tr></thead><tbody><tr v-for="r in sorted"><td v-if="method==='level-up'">{{r.level}}</td><td><NuxtLink :to="'/moves/'+r.slug">{{r.name}}</NuxtLink></td><td><NuxtLink :to="'/types/'+r.type" class="badge" :style="{'--badge':'var(--type-'+r.type+')'}">{{human(r.type)}}</NuxtLink></td><td>{{human(r.category)}}</td><td>{{r.power??'—'}}</td><td>{{r.accuracy??'—'}}</td><td>{{r.pp??'—'}}</td></tr></tbody></table></div></template>
