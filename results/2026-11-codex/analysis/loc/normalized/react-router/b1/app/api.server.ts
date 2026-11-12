const base = process.env.API_BASE_URL || "http://localhost:9000";
const cache = new Map<string, Promise<any>>();
export function api(path: string): Promise<any> {
  const url = path.startsWith("http")
    ? new URL(path).pathname + new URL(path).search
    : "/api/v2/" + path;
  if (!cache.has(url))
    cache.set(
      url,
      fetch(base + url)
        .then((r) => {
          if (!r.ok) throw new Response("Not found", { status: 404 });
          return r.json();
        })
        .catch((e) => {
          cache.delete(url);
          throw e;
        }),
    );
  return cache.get(url)!;
}
export const id = (r: any) => Number(r.url.split("/").filter(Boolean).at(-1));
export const english = (r: any) =>
  r.names?.find((n: any) => n.language.name === "en")?.name || r.name;
export const human = (s: string) =>
  s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
export const flavor = (r: any) =>
  r.flavor_text_entries
    ?.filter((x: any) => x.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ") || "—";
export async function species() {
  return (await api("pokemon-species/?limit=100000")).results;
}
export async function cards(refs: any[], types = false) {
  const list = await species();
  return Promise.all(
    refs
      .filter((r) => id(r.pokemon || r) < 10000)
      .sort((a, b) => id(a.pokemon || a) - id(b.pokemon || b))
      .map(async (r) => {
        const ref = r.pokemon || r,
          n = id(ref),
          s = list.find((x: any) => id(x) === n);
        const p = types ? await api("pokemon/" + n) : null;
        return {
          id: n,
          name: s.name,
          sprite: base + "/media/sprites/pokemon/" + n + ".png",
          types: p?.types,
          hidden: r.is_hidden,
        };
      }),
  );
}
export async function load(request: Request) {
  const u = new URL(request.url),
    p = u.pathname
      .replace(/\.data$/, "")
      .replace(/^\/_$/, "/")
      .split("/")
      .filter(Boolean),
    q = u.searchParams;
  if (!p.length) {
    const [all, ts, gs] = await Promise.all([
      species(),
      api("type/?limit=100"),
      api("generation/?limit=100"),
    ]);
    const types = ts.results.filter(
      (x: any) => !["stellar", "unknown", "shadow"].includes(x.name),
    );
    const generations = await Promise.all(
      gs.results.map((x: any) => api(x.url)),
    );
    let filtered = all.filter((x: any) =>
      human(x.name)
        .toLowerCase()
        .includes((q.get("q") || "").toLowerCase()),
    );
    if (q.get("type")) {
      const t = await api("type/" + q.get("type"));
      const ids = new Set(t.pokemon.map((x: any) => id(x.pokemon)));
      filtered = filtered.filter((x: any) => ids.has(id(x)));
    }
    if (q.get("generation")) {
      const g = await api("generation/" + q.get("generation"));
      const ids = new Set(g.pokemon_species.map(id));
      filtered = filtered.filter((x: any) => ids.has(id(x)));
    }
    const total = filtered.length,
      pages = Math.max(1, Math.ceil(total / 48)),
      page = Math.max(1, Math.min(pages, Number(q.get("page")) || 1));
    return {
      kind: "home",
      title: "Pokémon",
      types,
      generations,
      total,
      page,
      pages,
      cards: await cards(filtered.slice((page - 1) * 48, page * 48), true),
    };
  }
  if (p[0] === "types" && p.length === 1) {
    const ts = await api("type/?limit=100");
    const types = await Promise.all(
      ts.results
        .filter((x: any) => !["stellar", "unknown", "shadow"].includes(x.name))
        .map((x: any) => api(x.url)),
    );
    return { kind: "type-list", title: "Types", types };
  }
  if (
    p.length !== 2 ||
    !["pokemon", "moves", "abilities", "types"].includes(p[0])
  )
    return { kind: "missing", title: "Not found" };
  const kind = p[0];
  if (kind === "pokemon") {
    const s = await api("pokemon-species/" + p[1]),
      pk = await api("pokemon/" + s.id);
    const [chain, moves] = await Promise.all([
      api(s.evolution_chain.url),
      Promise.all(
        pk.moves.map(async (x: any) => ({
          ...x,
          detail: await api(x.move.url),
        })),
      ),
    ]);
    const refs = new Map();
    moves.forEach((m: any) =>
      m.version_group_details.forEach((v: any) =>
        refs.set(v.version_group.name, v.version_group),
      ),
    );
    const games = (
      await Promise.all([...refs.values()].map((x: any) => api(x.url)))
    ).sort((a, b) => a.order - b.order);
    return {
      kind,
      title: english(s),
      s,
      pk,
      chain: chain.chain,
      moves,
      games,
      game: q.get("game") || games.at(-1)?.name,
    };
  }
  const resource = await api(
    ({ moves: "move", abilities: "ability", types: "type" } as any)[kind] +
      "/" +
      p[1],
  );
  return {
    kind,
    title: english(resource),
    resource,
    cards: await cards(
      kind === "moves" ? resource.learned_by_pokemon : resource.pokemon,
    ),
  };
}
