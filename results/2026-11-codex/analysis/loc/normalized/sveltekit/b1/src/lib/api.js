const env = process.env;
export const human = (s) =>
  s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
export const english = (r) =>
  r.names?.find((x) => x.language.name === "en")?.name || human(r.name);
export const flavor = (r) =>
  r.flavor_text_entries
    ?.filter((x) => x.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ") || "—";
export const id = (r) =>
  Number((typeof r === "string" ? r : r.url).match(/\/(\d+)\/?$/)[1]);
const cache = new Map();
export function api(path) {
  const base = env.API_BASE_URL || "http://localhost:9000";
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
export async function cards(refs) {
  const species = (await api("pokemon-species/?limit=10000")).results;
  return refs
    .filter((x) => id(x.pokemon || x) <= 10000)
    .map((x) => {
      const n = id(x.pokemon || x);
      return {
        id: n,
        name: species.find((s) => id(s) === n)?.name,
        hidden: x.is_hidden || false,
      };
    })
    .filter((x) => x.name)
    .sort((a, b) => a.id - b.id);
}
export async function loadPage(path, url) {
  const parts = path?.split("/") || [];
  const kind = parts[0] || "home";
  const name = parts[1];
  const types = (await api("type/?limit=100")).results.filter(
    (t) => !["stellar", "unknown", "shadow"].includes(t.name),
  );
  const typeData = await Promise.all(types.map((t) => api(t.url)));
  const common = {
    types: typeData.map((t) => ({ name: t.name, label: english(t) })),
    media: env.API_BASE_URL || "http://localhost:9000",
  };
  if (kind === "home") {
    let all = (await api("pokemon-species/?limit=10000")).results
      .map((s) => ({ id: id(s), name: s.name }))
      .sort((a, b) => a.id - b.id);
    const gens = await Promise.all(
      (await api("generation/?limit=100")).results.map((g) => api(g.url)),
    );
    const q = url.searchParams.get("q") || "",
      type = url.searchParams.get("type") || "",
      generation = url.searchParams.get("generation") || "";
    if (q)
      all = all.filter((s) =>
        human(s.name).toLowerCase().includes(q.toLowerCase()),
      );
    if (type) {
      const ids = new Set(
        typeData
          .find((t) => t.name === type)
          ?.pokemon.map((x) => id(x.pokemon)),
      );
      all = all.filter((s) => ids.has(s.id));
    }
    if (generation) {
      const ids = new Set(
        gens.find((g) => g.name === generation)?.pokemon_species.map(id),
      );
      all = all.filter((s) => ids.has(s.id));
    }
    const total = Math.max(1, Math.ceil(all.length / 48)),
      page = Math.min(
        total,
        Math.max(1, Number(url.searchParams.get("page")) || 1),
      );
    const entries = await Promise.all(
      all.slice((page - 1) * 48, page * 48).map(async (s) => ({
        ...s,
        types: (await api(`pokemon/${s.id}/`)).types.map((t) => t.type.name),
      })),
    );
    return {
      ...common,
      kind,
      title: "Pokémon",
      entries,
      count: all.length,
      page,
      total,
      q,
      type,
      generation,
      gens: gens.map((g) => ({ name: g.name, label: english(g) })),
    };
  }
  if (kind === "types" && !name)
    return { ...common, kind: "types", title: "Types" };
  if (!name || parts.length !== 2) throw Error();
  if (kind === "pokemon") {
    const species = await api(`pokemon-species/${name}/`),
      p = await api(`pokemon/${species.id}/`);
    const games = [
      ...new Set(
        p.moves.flatMap((m) =>
          m.version_group_details.map((v) => v.version_group.name),
        ),
      ),
    ];
    const versions = (
      await Promise.all(games.map((g) => api(`version-group/${g}/`)))
    ).sort((a, b) => a.order - b.order);
    const game = games.includes(url.searchParams.get("game"))
      ? url.searchParams.get("game")
      : versions.at(-1)?.name;
    const moves = await Promise.all(
      p.moves
        .filter((m) =>
          m.version_group_details.some((v) => v.version_group.name === game),
        )
        .map(async (m) => ({
          data: await api(m.move.url),
          details: m.version_group_details.filter(
            (v) => v.version_group.name === game,
          ),
        })),
    );
    return {
      ...common,
      kind,
      title: english(species),
      species,
      p,
      flavor: flavor(species),
      chain: (await api(species.evolution_chain.url)).chain,
      versions,
      game,
      moves,
    };
  }
  if (kind === "moves") {
    const r = await api(`move/${name}/`);
    return {
      ...common,
      kind,
      title: english(r),
      r,
      effect:
        r.effect_entries.find((e) => e.language.name === "en")?.short_effect ||
        flavor(r),
      entries: await cards(r.learned_by_pokemon),
    };
  }
  if (kind === "abilities") {
    const r = await api(`ability/${name}/`);
    return {
      ...common,
      kind,
      title: english(r),
      r,
      effect:
        r.effect_entries.find((e) => e.language.name === "en")?.short_effect ||
        "—",
      entries: await cards(r.pokemon),
    };
  }
  if (kind === "types" && types.some((t) => t.name === name)) {
    const r = await api(`type/${name}/`);
    return {
      ...common,
      kind: "type",
      title: english(r),
      r,
      entries: await cards(r.pokemon),
    };
  }
  throw Error();
}
