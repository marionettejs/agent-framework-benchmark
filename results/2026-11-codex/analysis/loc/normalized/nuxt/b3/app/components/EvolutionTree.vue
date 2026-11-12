<script setup>
defineProps({ node: Object });
const human = (s) =>
  s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
</script>
<template>
  <li>
    <NuxtLink :to="'/pokemon/' + node.species.name">{{
      human(node.species.name)
    }}</NuxtLink>
    <ul v-if="node.evolves_to.length">
      <EvolutionTree v-for="child in node.evolves_to" :node="child" />
    </ul>
  </li>
</template>
