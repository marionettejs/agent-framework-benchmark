<script setup>
defineProps({ items: Array });
const human = (s) =>
  s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
</script>
<template>
  <ul class="cards">
    <li v-for="c in items" :key="c.id">
      <NuxtLink :to="'/pokemon/' + c.name"
        ><img
          :src="c.sprite"
          :alt="human(c.name)"
          width="96"
          height="96"
        /><span class="dex">#{{ String(c.id).padStart(4, "0") }}</span
        ><span>{{ human(c.name) }}</span
        ><span v-if="c.types" class="badges"
          ><TypeBadge v-for="t in c.types" :key="t" :name="t" /></span
        ><span v-if="c.hidden" class="muted">Hidden ability</span></NuxtLink
      >
    </li>
  </ul>
</template>
