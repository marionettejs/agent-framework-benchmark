<script setup>
const props = defineProps(["method", "rows"]);
const sort = ref(null);
const desc = ref(false);
const human = (s) =>
  s
    .split("-")
    .map((w) => (w[0]?.toUpperCase() || "") + w.slice(1))
    .join(" ");
const en = (m) =>
  m.names.find((n) => n.language.name === "en")?.name || human(m.name);
const cols = computed(() => [
  ...(props.method === "level-up" ? ["Level"] : []),
  "Move",
  "Type",
  "Category",
  "Power",
  "Accuracy",
  "PP",
]);
const value = (m, c) =>
  ({
    Level: m.level,
    Move: en(m),
    Type: human(m.type.name),
    Category: human(m.damage_class.name),
    Power: m.power,
    Accuracy: m.accuracy,
    PP: m.pp,
  })[c];
const sorted = computed(() =>
  [...props.rows].sort((a, b) => {
    const c = sort.value || (props.method === "level-up" ? "Level" : "Move");
    const x = value(a, c),
      y = value(b, c);
    if (x == null) return y == null ? 0 : 1;
    if (y == null) return -1;
    const d = typeof x === "number" ? x - y : x.localeCompare(y);
    return d * (desc.value ? -1 : 1) || en(a).localeCompare(en(b));
  }),
);
function toggle(c) {
  desc.value = sort.value === c ? !desc.value : false;
  sort.value = c;
}
</script>
<template>
  <div class="table-scroll">
    <table>
      <caption>
        {{
          human(method)
        }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="c in cols"
            :aria-sort="
              sort === c ? (desc ? 'descending' : 'ascending') : undefined
            "
          >
            <button @click="toggle(c)">{{ c }}</button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in sorted">
          <td v-for="c in cols">
            <a v-if="c === 'Move'" :href="'/moves/' + m.name">{{
              value(m, c)
            }}</a
            ><a
              v-else-if="c === 'Type'"
              class="badge"
              :style="{ '--badge': 'var(--type-' + m.type.name + ')' }"
              :href="'/types/' + m.type.name"
              >{{ value(m, c) }}</a
            ><template v-else>{{ value(m, c) ?? "—" }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
