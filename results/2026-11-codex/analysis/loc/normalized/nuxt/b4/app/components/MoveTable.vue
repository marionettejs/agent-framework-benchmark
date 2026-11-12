<script setup>
const props = defineProps({ method: String, moves: Array });
const key = ref("");
const desc = ref(false);
const human = (s) =>
  s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
const columns = computed(() => [
  ...(props.method === "level-up" ? ["Level"] : []),
  "Move",
  "Type",
  "Category",
  "Power",
  "Accuracy",
  "PP",
]);
const value = (r, k) =>
  r[{ Move: "label", Level: "level", PP: "pp" }[k] || k.toLowerCase()];
const rows = computed(() =>
  [...props.moves].sort((a, b) => {
    if (!key.value)
      return (
        (props.method === "level-up" ? a.level - b.level : 0) ||
        a.label.localeCompare(b.label)
      );
    const x = value(a, key.value),
      y = value(b, key.value);
    if (x == null) return y == null ? 0 : 1;
    if (y == null) return -1;
    return (
      (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) *
      (desc.value ? -1 : 1)
    );
  }),
);
function sort(k) {
  desc.value = key.value === k ? !desc.value : false;
  key.value = k;
}
</script>
<template>
  <div class="table-wrap">
    <table class="moves-table">
      <caption>
        {{
          human(method)
        }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="c in columns"
            :key="c"
            :aria-sort="
              key === c ? (desc ? 'descending' : 'ascending') : undefined
            "
          >
            <button @click="sort(c)">{{ c }}</button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="i">
          <td v-if="method === 'level-up'">{{ r.level }}</td>
          <td>
            <NuxtLink :to="'/moves/' + r.name">{{ r.label }}</NuxtLink>
          </td>
          <td><TypeBadge :name="r.type" linked /></td>
          <td>{{ r.category }}</td>
          <td>{{ r.power ?? "—" }}</td>
          <td>{{ r.accuracy ?? "—" }}</td>
          <td>{{ r.pp ?? "—" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
