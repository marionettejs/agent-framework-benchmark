const cache = new Map<string, Promise<any>>();
export default defineEventHandler(async (event) => {
  const base = process.env.API_BASE_URL || useRuntimeConfig(event).apiBase;
  const get = (path: string): Promise<any> => {
    const url = path.startsWith("http") ? path : `${base}/api/v2/${path}`;
    if (!cache.has(url))
      cache.set(
        url,
        $fetch(url).catch((e) => {
          cache.delete(url);
          throw e;
        }),
      );
    return cache.get(url)!;
  };
  const all = async (kind: string) =>
    (await get(`${kind}/?limit=10000`)).results;
  const id = (r: any) => Number(r.url.split("/").filter(Boolean).pop());
  const cards = async (refs: any[]) =>
    Promise.all(
      refs
        .filter((r) => id(r.pokemon || r) < 10000)
        .sort((a, b) => id(a.pokemon || a) - id(b.pokemon || b))
        .map(async (r) => {
          const p = await get((r.pokemon || r).url);
          return {
            id: p.id,
            name: p.species.name,
            sprite: p.sprites.front_default,
            types: p.types.map((t: any) => t.type.name),
            hidden: r.is_hidden,
          };
        }),
    );
  const path = String(getQuery(event).path || "/")
    .split("/")
    .filter(Boolean);
  try {
    if (!path.length) {
      const [species, types, gens] = await Promise.all([
        all("pokemon-species"),
        all("type"),
        all("generation"),
      ]);
      const generations = await Promise.all(gens.map((g: any) => get(g.url)));
      const list = await cards(
        species.map((s: any) => ({
          name: s.name,
          url: `${base}/api/v2/pokemon/${id(s)}/`,
        })),
      );
      return {
        kind: "home",
        list,
        types: await Promise.all(
          types
            .filter(
              (t: any) => !["stellar", "unknown", "shadow"].includes(t.name),
            )
            .map((t: any) =>
              get(t.url).then((x) => ({ name: x.name, names: x.names })),
            ),
        ),
        generations: generations.map((g) => ({
          name: g.name,
          names: g.names,
          species: g.pokemon_species.map((s: any) => s.name),
        })),
      };
    }
    if (path[0] === "types" && path.length === 1) {
      return {
        kind: "types",
        types: await Promise.all(
          (await all("type"))
            .filter(
              (t: any) => !["stellar", "unknown", "shadow"].includes(t.name),
            )
            .map((t: any) => get(t.url)),
        ),
      };
    }
    if (path.length !== 2) return { kind: "missing" };
    const [kind, name] = path;
    if (kind === "pokemon") {
      const s = await get(`pokemon-species/${name}/`);
      const p = await get(`pokemon/${s.id}/`);
      const [evolution, moves, games] = await Promise.all([
        get(s.evolution_chain.url),
        Promise.all(p.moves.map((m: any) => get(m.move.url))),
        Promise.all(
          [
            ...new Map(
              p.moves.flatMap((m: any) =>
                m.version_group_details.map((v: any) => [
                  v.version_group.name,
                  v.version_group,
                ]),
              ),
            ).values(),
          ].map((g: any) => get(g.url)),
        ),
      ]);
      return {
        kind,
        s,
        p,
        evolution: evolution.chain,
        moves,
        games: games.sort((a, b) => a.order - b.order),
      };
    }
    const resource = (
      { moves: "move", abilities: "ability", types: "type" } as any
    )[kind];
    if (!resource) return { kind: "missing" };
    const d = await get(`${resource}/${name}/`);
    const refs = kind === "moves" ? d.learned_by_pokemon : d.pokemon;
    return { kind, d, list: await cards(refs) };
  } catch {
    return { kind: "missing" };
  }
});
