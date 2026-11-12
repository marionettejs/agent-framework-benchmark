<script setup>defineProps({nodes:Array});const human=s=>s.split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')</script>
<template><ul v-if="nodes.length"><li v-for="n in nodes" :key="n.species.name"><NuxtLink :to="'/pokemon/'+n.species.name">{{human(n.species.name)}}</NuxtLink><EvolutionTree :nodes="n.evolves_to"/></li></ul></template>
