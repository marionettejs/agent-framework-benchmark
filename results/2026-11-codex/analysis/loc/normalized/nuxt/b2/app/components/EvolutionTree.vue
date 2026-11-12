<script setup>
const props = defineProps(["node", "nodes"]);
const human = (s) =>
  s
    .split("-")
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join(" ");
</script>
<template>
  <ul>
    <li v-for="n in nodes || [node]" :key="n.species.name">
      <a :href="`/pokemon/${n.species.name}`">{{ human(n.species.name) }}</a
      ><EvolutionTree v-if="n.evolves_to.length" :nodes="n.evolves_to" />
    </li>
  </ul>
</template>
