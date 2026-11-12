<script setup>
defineProps({ name: String, link: Boolean });
const label = (s) => s.charAt(0).toUpperCase() + s.slice(1);
</script>
<template>
  <a
    v-if="link"
    class="badge"
    :style="{ background: `var(--type-${name})` }"
    :href="`/types/${name}`"
    >{{ label(name) }}</a
  ><span v-else class="badge" :style="{ background: `var(--type-${name})` }">{{
    label(name)
  }}</span>
</template>
