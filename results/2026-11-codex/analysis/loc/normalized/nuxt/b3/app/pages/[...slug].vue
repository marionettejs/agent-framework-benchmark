<script setup>
const route = useRoute();
const router = useRouter();
const { data } = await useAsyncData(
  () => route.path,
  () => $fetch("/api/page", { query: { path: route.path } }),
);
const human = (s) =>
  s
    ?.split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "";
const english = (d) =>
  d?.names?.find((n) => n.language.name === "en")?.name || human(d?.name);
const flavor = (d) =>
  d?.flavor_text_entries
    ?.filter((x) => x.language.name === "en")
    .at(-1)
    ?.flavor_text?.replace(/\s+/g, " ") || "—";
const effect = (d) =>
  d?.effect_entries?.find((x) => x.language.name === "en")?.short_effect ||
  flavor(d);
const title = computed(() =>
  data.value.kind === "home"
    ? "Pokémon"
    : data.value.kind === "pokemon"
      ? english(data.value.s)
      : data.value.kind === "types" && !data.value.d
        ? "Types"
        : data.value.d
          ? english(data.value.d)
          : "Not found",
);
useHead(() => ({
  title: data.value.kind === "home" ? "Pokédex" : `${title.value} – Pokédex`,
}));
const query = computed(() => route.query);
function update(key, value) {
  const q = { ...route.query, [key]: value };
  if (!value) delete q[key];
  if (key !== "game") delete q.page;
  router.replace({ query: q, hash: route.hash });
}
const filtered = computed(() => {
  if (data.value.kind !== "home") return [];
  const gen = data.value.generations.find(
    (g) => g.name === query.value.generation,
  );
  return data.value.list.filter(
    (p) =>
      (!query.value.q ||
        human(p.name)
          .toLowerCase()
          .includes(String(query.value.q).toLowerCase())) &&
      (!query.value.type || p.types.includes(query.value.type)) &&
      (!gen || gen.species.includes(p.name)),
  );
});
const page = computed(() => Number(query.value.page) || 1);
const total = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / 48)),
);
const pageLink = (n) => ({
  path: "/",
  query: { ...query.value, page: n === 1 ? undefined : n },
});
const game = computed(() => query.value.game || data.value.games?.at(-1)?.name);
const methods = computed(() => {
  if (data.value.kind !== "pokemon") return [];
  const groups = {};
  data.value.p.moves.forEach((m, i) =>
    m.version_group_details
      .filter((v) => v.version_group.name === game.value)
      .forEach((v) => {
        const d = data.value.moves[i];
        (groups[v.move_learn_method.name] ??= []).push({
          level: v.level_learned_at,
          name: english(d),
          slug: d.name,
          type: d.type.name,
          category: d.damage_class.name,
          power: d.power,
          accuracy: d.accuracy,
          pp: d.pp,
        });
      }),
  );
  const order = ["level-up", "machine", "egg", "tutor"];
  return Object.entries(groups).sort(([a], [b]) => {
    const x = order.indexOf(a),
      y = order.indexOf(b);
    return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || a.localeCompare(b);
  });
});
const relations = [
  ["Super effective against", "double_damage_to"],
  ["Not very effective against", "half_damage_to"],
  ["No effect against", "no_damage_to"],
  ["Weak to", "double_damage_from"],
  ["Resists", "half_damage_from"],
  ["Immune to", "no_damage_from"],
];
const stats = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
</script>
<template>
  <header>
    <div class="header-inner">
      <NuxtLink class="brand" to="/">Pokédex</NuxtLink>
      <nav>
        <NuxtLink to="/">Pokémon</NuxtLink
        ><NuxtLink to="/types">Types</NuxtLink>
      </nav>
    </div>
  </header>
  <main>
    <template v-if="data.kind === 'home'"
      ><h1>{{ title }}</h1>
      <div class="filters">
        <label
          >Search<input
            type="search"
            :value="query.q || ''"
            @input="update('q', $event.target.value)" /></label
        ><label
          >Type<select
            aria-label="Type"
            :value="query.type || ''"
            @change="update('type', $event.target.value)"
          >
            <option value="">All types</option>
            <option v-for="t in data.types" :value="t.name">
              {{ english(t) }}
            </option>
          </select></label
        ><label
          >Generation<select
            aria-label="Generation"
            :value="query.generation || ''"
            @change="update('generation', $event.target.value)"
          >
            <option value="">All generations</option>
            <option v-for="g in data.generations" :value="g.name">
              {{ english(g) }}
            </option>
          </select></label
        >
      </div>
      <p class="count">{{ filtered.length }} Pokémon</p>
      <PokeCards
        v-if="filtered.length"
        :items="filtered.slice((page - 1) * 48, page * 48)"
        show-types
      />
      <p v-else>No Pokémon found</p>
      <div class="pagination">
        <NuxtLink v-if="page > 1" :to="pageLink(page - 1)"
          >Previous page</NuxtLink
        ><span>Page {{ page }} of {{ total }}</span
        ><NuxtLink v-if="page < total" :to="pageLink(page + 1)"
          >Next page</NuxtLink
        >
      </div></template
    >
    <template v-else-if="data.kind === 'pokemon'">
      <div class="summary">
        <img
          class="artwork"
          :src="data.p.sprites.other['official-artwork'].front_default"
          :alt="title"
        />
        <div>
          <div class="dex">#{{ String(data.s.id).padStart(4, "0") }}</div>
          <h1>{{ title }}</h1>
          <p class="muted genus">
            {{ data.s.genera.find((g) => g.language.name === "en")?.genus }}
          </p>
          <div class="badges">
            <NuxtLink
              v-for="t in data.p.types"
              :to="'/types/' + t.type.name"
              class="badge"
              :style="{ '--badge': 'var(--type-' + t.type.name + ')' }"
              >{{ human(t.type.name) }}</NuxtLink
            >
          </div>
          <dl class="measurements">
            <div>
              <dt>Height</dt>
              <dd>{{ (data.p.height / 10).toFixed(1) }} m</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{{ (data.p.weight / 10).toFixed(1) }} kg</dd>
            </div>
          </dl>
          <p>{{ flavor(data.s) }}</p>
        </div>
      </div>
      <section aria-labelledby="stats">
        <h2 id="stats">Base stats</h2>
        <table class="stats">
          <tbody>
            <tr
              v-for="(s, i) in [
                ...data.p.stats,
                {
                  base_stat: data.p.stats.reduce((n, s) => n + s.base_stat, 0),
                },
              ]"
            >
              <th scope="row">{{ stats[i] || "Total" }}</th>
              <td>{{ s.base_stat }}</td>
              <td>
                <div class="track">
                  <div
                    :style="{
                      width:
                        Math.min(
                          100,
                          (s.base_stat / (i === 6 ? 1500 : 255)) * 100,
                        ) + '%',
                    }"
                  ></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      <section aria-labelledby="abilities">
        <h2 id="abilities">Abilities</h2>
        <ul>
          <li v-for="a in data.p.abilities">
            <NuxtLink :to="'/abilities/' + a.ability.name">{{
              human(a.ability.name)
            }}</NuxtLink
            ><span v-if="a.is_hidden"> (hidden)</span>
          </li>
        </ul>
      </section>
      <section aria-labelledby="evolution">
        <h2 id="evolution">Evolution</h2>
        <ul>
          <EvolutionTree :node="data.evolution" />
        </ul>
      </section>
      <section id="moves" aria-labelledby="moves-heading">
        <h2 id="moves-heading">Moves</h2>
        <label class="game"
          >Game
          <select
            aria-label="Game"
            :value="game"
            @change="update('game', $event.target.value)"
          >
            <option v-for="g in data.games" :value="g.name">
              {{ human(g.name) }}
            </option>
          </select></label
        ><MoveTable
          v-for="[method, rows] in methods"
          :key="game + method"
          :method="method"
          :rows="rows"
        />
      </section>
    </template>
    <template v-else-if="data.kind === 'types' && !data.d"
      ><h1>Types</h1>
      <ul class="type-list">
        <li v-for="t in data.types">
          <NuxtLink
            class="badge"
            :style="{ '--badge': 'var(--type-' + t.name + ')' }"
            :to="'/types/' + t.name"
            >{{ english(t) }}</NuxtLink
          >
        </li>
      </ul></template
    >
    <template v-else-if="data.d"
      ><h1>{{ title }}</h1>
      <template v-if="data.kind === 'moves'"
        ><dl class="detail-list">
          <template
            v-for="[k, v] in [
              ['Type', data.d.type.name],
              ['Category', human(data.d.damage_class.name)],
              ['Power', data.d.power],
              ['Accuracy', data.d.accuracy],
              ['PP', data.d.pp],
            ]"
            ><dt>{{ k }}</dt>
            <dd>
              <NuxtLink
                v-if="k === 'Type'"
                :to="'/types/' + v"
                class="badge"
                :style="{ '--badge': 'var(--type-' + v + ')' }"
                >{{ human(v) }}</NuxtLink
              ><template v-else>{{ v ?? "—" }}</template>
            </dd></template
          >
        </dl></template
      >
      <section v-if="data.kind !== 'types'" aria-labelledby="effect">
        <h2 id="effect">Effect</h2>
        <p>{{ effect(data.d) }}</p>
      </section>
      <section v-else aria-labelledby="damage">
        <h2 id="damage">Damage relations</h2>
        <dl class="relations">
          <template v-for="[label, key] in relations"
            ><dt>{{ label }}</dt>
            <dd>
              <template v-if="data.d.damage_relations[key].length"
                ><NuxtLink
                  v-for="t in data.d.damage_relations[key]"
                  class="badge"
                  :style="{ '--badge': 'var(--type-' + t.name + ')' }"
                  :to="'/types/' + t.name"
                  >{{ human(t.name) }}</NuxtLink
                ></template
              ><template v-else>None</template>
            </dd></template
          >
        </dl>
      </section>
      <section aria-labelledby="pokemon-list">
        <h2 id="pokemon-list">
          {{ data.kind === "moves" ? "Learned by" : "Pokémon" }}
        </h2>
        <p class="count">{{ data.list.length }} Pokémon</p>
        <PokeCards :items="data.list" />
      </section>
      <section v-if="data.kind === 'types'" aria-labelledby="type-moves">
        <h2 id="type-moves">Moves</h2>
        <p>{{ data.d.moves.length }} moves</p>
        <ul class="move-list">
          <li
            v-for="m in [...data.d.moves].sort((a, b) =>
              human(a.name).localeCompare(human(b.name)),
            )"
          >
            <NuxtLink :to="'/moves/' + m.name">{{ human(m.name) }}</NuxtLink>
          </li>
        </ul>
      </section>
    </template>
    <template v-else
      ><h1>Not found</h1>
      <NuxtLink to="/">Back to Pokémon</NuxtLink></template
    >
  </main>
  <footer>
    Data from PokéAPI. Pokémon and Pokémon character names are trademarks of
    Nintendo.
  </footer>
</template>
