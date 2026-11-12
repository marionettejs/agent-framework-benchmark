const cache = new Map<string, Promise<any>>();
const id = (x: any) => Number(x.url.split("/").filter(Boolean).pop());
async function api(path: string): Promise<any> {
  const base = process.env.API_BASE_URL || "http://localhost:9000";
  const key = base + path;
  if (!cache.has(key))
    cache.set(
      key,
      $fetch(path.startsWith("http") ? path : base + "/api/v2/" + path).catch(
        (e) => {
          cache.delete(key);
          throw e;
        },
      ),
    );
  return cache.get(key);
}
async function all(kind: string) {
  return (await api(kind + "/?limit=100000")).results;
}
async function cards(refs: any[]) {
  const species = await all("pokemon-species");
  const byId = new Map(species.map((s: any) => [id(s), s]));
  return refs
    .map((r: any) => {
      const p = r.pokemon || r;
      const n = id(p);
      return { id: n, name: (byId.get(n) as any)?.name, hidden: r.is_hidden };
    })
    .filter((r) => r.name)
    .sort((a, b) => a.id - b.id);
}
export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const path = String(q.path || "/")
    .split("/")
    .filter(Boolean);
  try {
    const types = (await all("type")).filter(
      (t: any) => !["stellar", "shadow", "unknown"].includes(t.name),
    );
    if (!path.length) {
      const species = await all("pokemon-species");
      let list = species.map((s: any) => ({ id: id(s), name: s.name }));
      if (q.q)
        list = list.filter((s: any) =>
          s.name
            .replaceAll("-", " ")
            .toLowerCase()
            .includes(String(q.q).toLowerCase()),
        );
      if (q.type) {
        const t = await api("type/" + q.type);
        const ids = new Set(t.pokemon.map((p: any) => id(p.pokemon)));
        list = list.filter((s: any) => ids.has(s.id));
      }
      if (q.generation) {
        const g = await api("generation/" + q.generation);
        const ids = new Set(g.pokemon_species.map(id));
        list = list.filter((s: any) => ids.has(s.id));
      }
      list.sort((a: any, b: any) => a.id - b.id);
      const count = list.length;
      const pages = Math.max(1, Math.ceil(count / 48));
      const page = Math.max(1, Math.min(Number(q.page) || 1, pages));
      list = await Promise.all(
        list.slice((page - 1) * 48, page * 48).map(async (s: any) => ({
          ...s,
          types: (await api("pokemon/" + s.id)).types,
        })),
      );
      const generations = await Promise.all(
        (await all("generation")).map((g: any) => api("generation/" + g.name)),
      );
      return { kind: "home", list, count, pages, page, types, generations };
    }
    if (path[0] === "types" && path.length === 1)
      return { kind: "types", types };
    if (path.length !== 2) return { kind: "missing" };
    const [kind, name] = path;
    if (kind === "pokemon") {
      const s = await api("pokemon-species/" + name);
      const p = await api("pokemon/" + s.id);
      const evolution = await api(s.evolution_chain.url);
      const games = await Promise.all(
        [
          ...new Set(
            p.moves.flatMap((m: any) =>
              m.version_group_details.map((v: any) => v.version_group.name),
            ),
          ),
        ].map((g: any) => api("version-group/" + g)),
      );
      games.sort((a, b) => a.order - b.order);
      const moves = await Promise.all(
        p.moves.map(async (m: any) => ({
          ...(await api(m.move.url)),
          details: m.version_group_details,
        })),
      );
      return { kind, s, p, evolution: evolution.chain, games, moves };
    }
    if (kind === "types") {
      const t = await api("type/" + name);
      if (!types.some((x: any) => x.name === name)) return { kind: "missing" };
      return { kind, t, list: await cards(t.pokemon) };
    }
    if (kind === "moves") {
      const m = await api("move/" + name);
      return { kind, m, list: await cards(m.learned_by_pokemon) };
    }
    if (kind === "abilities") {
      const a = await api("ability/" + name);
      return { kind, a, list: await cards(a.pokemon) };
    }
    return { kind: "missing" };
  } catch {
    return { kind: "missing" };
  }
});
