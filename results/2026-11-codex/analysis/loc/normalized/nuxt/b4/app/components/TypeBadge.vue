<script setup>
defineProps({ name: String, linked: Boolean });
const human = (s) =>
  s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
</script>
<template>
  <NuxtLink
    v-if="linked"
    class="badge"
    :style="{ background: 'var(--type-' + name + ')' }"
    :to="'/types/' + name"
    >{{ human(name) }}</NuxtLink
  ><span
    v-else
    class="badge"
    :style="{ background: 'var(--type-' + name + ')' }"
    >{{ human(name) }}</span
  >
</template>
