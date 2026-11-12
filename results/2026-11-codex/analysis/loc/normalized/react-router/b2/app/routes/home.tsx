import { useLoaderData, useSearchParams } from "react-router";
import { api, speciesList, types, id, base } from "../api.server";
import { Cards, human, english } from "../ui";
export const meta = () => [{ title: "Pokédex" }];
export async function loader({ request }) {
  const q = new URL(request.url).searchParams;
  const [all, ts, gs] = await Promise.all([
    speciesList(),
    types(),
    api("generation/?limit=100").then((x) =>
      Promise.all(x.results.map((t) => api(t.url))),
    ),
  ]);
  let list = all.filter((x) =>
    human(x.name)
      .toLowerCase()
      .includes((q.get("q") || "").toLowerCase()),
  );
  if (q.get("type")) {
    const t = await api("type/" + q.get("type"));
    const ids = new Set(t.pokemon.map((x) => id(x.pokemon)));
    list = list.filter((x) => ids.has(id(x)));
  }
  if (q.get("generation")) {
    const g = gs.find((x) => x.name === q.get("generation"));
    const ids = new Set(g?.pokemon_species.map(id));
    list = list.filter((x) => ids.has(id(x)));
  }
  list.sort((a, b) => id(a) - id(b));
  const count = list.length,
    total = Math.max(1, Math.ceil(count / 48)),
    page = Math.min(total, Math.max(1, Number(q.get("page")) || 1));
  const items = await Promise.all(
    list.slice((page - 1) * 48, page * 48).map(async (x) => {
      const p = await api("pokemon/" + id(x));
      return {
        ...x,
        id: id(x),
        sprite: p.sprites.front_default,
        types: p.types.sort((a, b) => a.slot - b.slot),
      };
    }),
  );
  return {
    items,
    count,
    total,
    page,
    types: await Promise.all(ts.map((t) => api(t.url))),
    generations: gs,
  };
}
export default function Home() {
  const d = useLoaderData();
  const [q, setQ] = useSearchParams();
  function change(k, v) {
    const n = new URLSearchParams(q);
    n.delete("page");
    v ? n.set(k, v) : n.delete(k);
    setQ(n, { preventScrollReset: true });
  }
  function pageUrl(p) {
    const n = new URLSearchParams(q);
    p === 1 ? n.delete("page") : n.set("page", String(p));
    return "/" + (n.size ? "?" + n : "");
  }
  return (
    <>
      <h1>Pokémon</h1>
      <div className="filters">
        <label>
          Search
          <input
            type="search"
            defaultValue={q.get("q") || ""}
            onChange={(e) => change("q", e.target.value)}
          />
        </label>
        <label>
          Type
          <select
            aria-label="Type"
            value={q.get("type") || ""}
            onChange={(e) => change("type", e.target.value)}
          >
            <option value="">All types</option>
            {d.types.map((t) => (
              <option key={t.name} value={t.name}>
                {english(t)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Generation
          <select
            aria-label="Generation"
            value={q.get("generation") || ""}
            onChange={(e) => change("generation", e.target.value)}
          >
            <option value="">All generations</option>
            {d.generations.map((g) => (
              <option key={g.name} value={g.name}>
                {english(g)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted">{d.count} Pokémon</p>
      {d.count ? <Cards items={d.items} /> : <p>No Pokémon found</p>}
      <div className="pagination">
        {d.page > 1 && <a href={pageUrl(d.page - 1)}>Previous page</a>}
        <span>
          Page {d.page} of {d.total}
        </span>
        {d.page < d.total && <a href={pageUrl(d.page + 1)}>Next page</a>}
      </div>
    </>
  );
}
