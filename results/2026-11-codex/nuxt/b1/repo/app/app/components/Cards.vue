<script setup>
defineProps(['list'])
const human=s=>s.split('-').map(w=>(w[0]?.toUpperCase()||'')+w.slice(1)).join(' ')
const config=useRequestURL();
// Sprite requests go through the same runtime API origin as resource requests.
</script>
<template><ul class="cards"><li v-for="p in list" :key="p.id"><a :href="'/pokemon/'+p.name"><img :src="'/api/sprite?id='+p.id" alt=""><span class="number">#{{String(p.id).padStart(4,'0')}}</span><strong>{{human(p.name)}}</strong><span v-if="p.types" class="badges"><span v-for="t in p.types" class="badge" :style="{'--badge':'var(--type-'+t.type.name+')'}">{{human(t.type.name)}}</span></span><span v-if="p.hidden">Hidden ability</span></a></li></ul></template>
