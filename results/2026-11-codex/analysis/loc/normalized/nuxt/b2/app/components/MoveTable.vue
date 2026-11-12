<script setup>
const props = defineProps(["method", "rows"]);
const human = (s) =>
  s
    .split("-")
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join(" ");
const column = ref("");
const direction = ref(1);
const columns = computed(() => [
  ...(props.method === "level-up" ? ["Level"] : []),
  "Move",
  "Type",
  "Category",
  "Power",
  "Accuracy",
  "PP",
]);
const key = (c) => ({ Move: "label", PP: "pp" })[c] || c.toLowerCase();
function sort(c) {
  if (column.value === c) direction.value *= -1;
  else {
    column.value = c;
    direction.value = 1;
  }
}
const sorted = computed(() =>
  [...props.rows].sort((a, b) => {
    const k = column.value
      ? key(column.value)
      : props.method === "level-up"
        ? "level"
        : "label";
    const x = a[k],
      y = b[k];
    if (x == null) return y == null ? 0 : 1;
    if (y == null) return -1;
    const cmp =
      typeof x === "number" ? x - y : String(x).localeCompare(String(y));
    return (
      cmp * (column.value ? direction.value : 1) ||
      a.label.localeCompare(b.label)
    );
  }),
);
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
              column === c
                ? direction === 1
                  ? 'ascending'
                  : 'descending'
                : undefined
            "
          >
            <button @click="sort(c)">{{ c }}</button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in sorted" :key="i">
          <td v-if="method === 'level-up'">{{ r.level }}</td>
          <td>
            <a :href="`/moves/${r.name}`">{{ r.label }}</a>
          </td>
          <td><TypeBadge :name="r.type" link /></td>
          <td>{{ r.category }}</td>
          <td>{{ r.power ?? "—" }}</td>
          <td>{{ r.accuracy ?? "—" }}</td>
          <td>{{ r.pp ?? "—" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
