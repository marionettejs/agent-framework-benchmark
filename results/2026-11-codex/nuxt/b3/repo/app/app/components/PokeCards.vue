<script setup>
defineProps({items:Array,showTypes:Boolean})
const human=s=>s.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ')
</script>
<template><ul class="cards"><li v-for="p in items" :key="p.id"><NuxtLink :to="'/pokemon/'+p.name"><img :src="p.sprite" alt=""><span class="dex">#{{String(p.id).padStart(4,'0')}}</span><span>{{human(p.name)}}</span><span v-if="showTypes" class="badges"><span v-for="t in p.types" :class="['badge',t]" :style="{'--badge':'var(--type-'+t+')'}">{{human(t)}}</span></span><small v-if="p.hidden">Hidden ability</small></NuxtLink></li></ul></template>
