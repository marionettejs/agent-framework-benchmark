<script setup>
defineProps(["node"]);
const human = (s) =>
  s
    .split("-")
    .map((w) => (w[0]?.toUpperCase() || "") + w.slice(1))
    .join(" ");
</script>
<template>
  <ul>
    <li>
      <a :href="'/pokemon/' + node.species.name">{{
        human(node.species.name)
      }}</a
      ><Evolution v-for="child in node.evolves_to" :node="child" />
    </li>
  </ul>
</template>
