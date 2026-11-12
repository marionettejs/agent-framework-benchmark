import { english, human, flavor, idOf } from "#lib/utils";
const cache = new Map();
function api(path) {
  const base = process.env.API_BASE_URL || "http://localhost:9000";
  const url = path.startsWith("http") ? path : `${base}/api/v2/${path}`;
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw Error("Not found");
          return r.json();
        })
        .catch((e) => {
          cache.delete(url);
          throw e;
        }),
    );
  return cache.get(url);
}
const list = async (name) => (await api(`${name}/?limit=10000`)).results;
export async function load({ params, url }) {
  try {
    const parts = (params.path || "").split("/").filter(Boolean);
    const types = await Promise.all(
      (await list("type"))
        .filter((t) => !["stellar", "unknown", "shadow"].includes(t.name))
        .map((t) => api(t.url)),
    );
    const typeNames = Object.fromEntries(
      types.map((t) => [t.name, english(t)]),
    );
    const species = await list("pokemon-species");
    const speciesMap = new Map(species.map((s) => [idOf(s), s]));
    function cards(refs) {
      return refs
        .map((x) => ({ ref: x.pokemon || x, hidden: x.is_hidden }))
        .filter((x) => speciesMap.has(idOf(x.ref)))
        .sort((a, b) => idOf(a.ref) - idOf(b.ref))
        .map((x) => {
          const s = speciesMap.get(idOf(x.ref));
          return {
            id: idOf(s),
            name: s.name,
            hidden: x.hidden,
            sprite: `${process.env.API_BASE_URL || "http://localhost:9000"}/media/sprites/pokemon/${idOf(s)}.png`,
          };
        });
    }
    const shared = { types: typeNames };
    if (!parts.length) {
      const generations = await Promise.all(
        (await list("generation")).map((x) => api(x.url)),
      );
      let matches = species.filter((s) =>
        human(s.name)
          .toLowerCase()
          .includes((url.searchParams.get("q") || "").toLowerCase()),
      );
      const type = types.find((x) => x.name === url.searchParams.get("type"));
      if (type) {
        const ids = new Set(type.pokemon.map((x) => idOf(x.pokemon)));
        matches = matches.filter((s) => ids.has(idOf(s)));
      }
      const gen = generations.find(
        (x) => x.name === url.searchParams.get("generation"),
      );
      if (gen) {
        const ids = new Set(gen.pokemon_species.map(idOf));
        matches = matches.filter((s) => ids.has(idOf(s)));
      }
      matches.sort((a, b) => idOf(a) - idOf(b));
      const total = Math.max(1, Math.ceil(matches.length / 48));
      const page = Math.min(
        total,
        Math.max(1, Number(url.searchParams.get("page")) || 1),
      );
      const items = cards(matches.slice((page - 1) * 48, page * 48));
      await Promise.all(
        items.map(async (c) => {
          const p = await api(`pokemon/${c.id}/`);
          c.types = p.types
            .sort((a, b) => a.slot - b.slot)
            .map((x) => x.type.name);
          c.sprite = p.sprites.front_default || c.sprite;
        }),
      );
      return {
        ...shared,
        kind: "home",
        title: "Pokémon",
        items,
        count: matches.length,
        total,
        page,
        generations: generations.map((g) => ({
          name: g.name,
          label: english(g),
        })),
      };
    }
    if (parts.length === 1 && parts[0] === "types")
      return { ...shared, kind: "types", title: "Types" };
    if (parts.length !== 2) throw Error();
    const [kind, name] = parts;
    if (kind === "pokemon") {
      const s = await api(`pokemon-species/${name}/`);
      const p = await api(`pokemon/${s.id}/`);
      const chain = await api(s.evolution_chain.url);
      const gameRefs = new Map();
      for (const m of p.moves)
        for (const v of m.version_group_details)
          gameRefs.set(v.version_group.name, v.version_group);
      const games = (
        await Promise.all([...gameRefs.values()].map((r) => api(r.url)))
      ).sort((a, b) => a.order - b.order);
      const game =
        games.find((g) => g.name === url.searchParams.get("game"))?.name ||
        games.at(-1)?.name;
      const rows = await Promise.all(
        p.moves
          .filter((m) =>
            m.version_group_details.some((v) => v.version_group.name === game),
          )
          .map(async (m) => ({
            move: await api(m.move.url),
            details: m.version_group_details.filter(
              (v) => v.version_group.name === game,
            ),
          })),
      );
      const methods = {};
      for (const r of rows)
        for (const d of r.details) {
          const method = d.move_learn_method.name;
          (methods[method] ??= []).push({
            level: d.level_learned_at,
            name: r.move.name,
            Move: english(r.move),
            Type: typeNames[r.move.type.name] || human(r.move.type.name),
            type: r.move.type.name,
            Category: human(r.move.damage_class.name),
            Power: r.move.power,
            Accuracy: r.move.accuracy,
            PP: r.move.pp,
          });
        }
      const order = ["level-up", "machine", "egg", "tutor"];
      return {
        ...shared,
        kind,
        title: english(s),
        s,
        p,
        description: flavor(s),
        chain: chain.chain,
        games: games.map((g) => g.name),
        game,
        methods: Object.entries(methods)
          .sort(
            ([a], [b]) =>
              (order.includes(a) ? order.indexOf(a) : 4) -
                (order.includes(b) ? order.indexOf(b) : 4) ||
              a.localeCompare(b),
          )
          .map(([name, rows]) => ({
            name,
            rows: rows.sort(
              (a, b) =>
                (name === "level-up" ? a.level - b.level : 0) ||
                a.Move.localeCompare(b.Move),
            ),
          })),
      };
    }
    if (kind === "moves") {
      const r = await api(`move/${name}/`);
      return {
        ...shared,
        kind,
        title: english(r),
        r,
        effect:
          r.effect_entries.find((e) => e.language.name === "en")
            ?.short_effect || flavor(r),
        items: cards(r.learned_by_pokemon),
      };
    }
    if (kind === "abilities") {
      const r = await api(`ability/${name}/`);
      return {
        ...shared,
        kind,
        title: english(r),
        effect:
          r.effect_entries.find((e) => e.language.name === "en")
            ?.short_effect || "—",
        items: cards(r.pokemon),
      };
    }
    if (kind === "types") {
      const r = types.find((t) => t.name === name);
      if (!r) throw Error();
      return {
        ...shared,
        kind: "type",
        title: english(r),
        r,
        items: cards(r.pokemon),
      };
    }
    throw Error();
  } catch {
    return { kind: "missing", title: "Not found", types: {} };
  }
}
