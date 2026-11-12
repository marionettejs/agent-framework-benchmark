import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/page";
import { load } from "./api.server";
export const loader = ({ request }: Route.LoaderArgs) => load(request);
export const meta = ({ loaderData }: Route.MetaArgs) => [
  {
    title: !loaderData
      ? "Not found – Pokédex"
      : loaderData.kind === "home"
        ? "Pokédex"
        : loaderData.title + " – Pokédex",
  },
];
const human = (s: string) =>
  s
    .split("-")
    .map((x) => x[0]?.toUpperCase() + x.slice(1))
    .join(" ");
const english = (r: any) =>
  r.names?.find((n: any) => n.language.name === "en")?.name || human(r.name);
const flavor = (r: any) =>
  r.flavor_text_entries
    ?.filter((x: any) => x.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ") || "—";
const effect = (r: any) =>
  r.effect_entries?.find((x: any) => x.language.name === "en")?.short_effect ||
  flavor(r);
const val = (v: any) => v ?? "—";
function Type({ r }: { r: any }) {
  return (
    <Link
      className="badge"
      style={{ background: "var(--type-" + r.name + ")" }}
      to={"/types/" + r.name}
    >
      {human(r.name)}
    </Link>
  );
}
function Section({
  name,
  children,
  id,
}: {
  name: string;
  children: any;
  id?: string;
}) {
  const key = id || name.toLowerCase().replaceAll(" ", "-");
  return (
    <section id={key} aria-labelledby={key + "-heading"}>
      <h2 id={key + "-heading"}>{name}</h2>
      {children}
    </section>
  );
}
function Cards({
  items,
  showTypes = false,
}: {
  items: any[];
  showTypes?: boolean;
}) {
  return (
    <ul className="cards">
      {items.map((p) => (
        <li key={p.id}>
          <Link to={"/pokemon/" + p.name}>
            <img src={p.sprite} alt={human(p.name)} />
            <span className="dex">#{String(p.id).padStart(4, "0")}</span>
            <span>{human(p.name)}</span>
            {showTypes && (
              <span>
                {p.types.map((t: any) => (
                  <span
                    key={t.slot}
                    className="badge"
                    style={{ background: "var(--type-" + t.type.name + ")" }}
                  >
                    {human(t.type.name)}
                  </span>
                ))}
              </span>
            )}
            {p.hidden && <span>Hidden ability</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
function Evolution({ node }: { node: any }) {
  return (
    <ul>
      <li>
        <Link to={"/pokemon/" + node.species.name}>
          {human(node.species.name)}
        </Link>
        {node.evolves_to.map((n: any) => (
          <Evolution key={n.species.name} node={n} />
        ))}
      </li>
    </ul>
  );
}
function MoveTable({ name, rows }: { name: string; rows: any[] }) {
  const level = name === "level-up",
    cols = [
      ...(level ? ["Level"] : []),
      "Move",
      "Type",
      "Category",
      "Power",
      "Accuracy",
      "PP",
    ];
  const [sort, setSort] = useState<{ col: string; desc: boolean } | null>(null);
  const value = (r: any, c: string) =>
    ({
      Level: r.level,
      Move: english(r),
      Type: human(r.type.name),
      Category: human(r.damage_class.name),
      Power: r.power,
      Accuracy: r.accuracy,
      PP: r.pp,
    })[c];
  const sorted = [...rows].sort((a, b) => {
    if (!sort)
      return (
        (level ? a.level - b.level : 0) || english(a).localeCompare(english(b))
      );
    const x = value(a, sort.col),
      y = value(b, sort.col);
    if (x == null) return y == null ? 0 : 1;
    if (y == null) return -1;
    return (
      (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) *
      (sort.desc ? -1 : 1)
    );
  });
  return (
    <div className="table-wrap">
      <table>
        <caption>{human(name)}</caption>
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                aria-sort={
                  sort?.col === c
                    ? sort.desc
                      ? "descending"
                      : "ascending"
                    : undefined
                }
              >
                <button
                  onClick={() =>
                    setSort({
                      col: c,
                      desc: sort?.col === c ? !sort.desc : false,
                    })
                  }
                >
                  {c}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.name}>
              {cols.map((c) => (
                <td key={c}>
                  {c === "Move" ? (
                    <Link to={"/moves/" + r.name}>{english(r)}</Link>
                  ) : c === "Type" ? (
                    <Type r={r.type} />
                  ) : (
                    val(value(r, c))
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default function Page({ loaderData: d }: Route.ComponentProps) {
  const [params, setParams] = useSearchParams();
  const update = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    v ? p.set(k, v) : p.delete(k);
    p.delete("page");
    setParams(p, { preventScrollReset: k === "game" });
  };
  if (d.kind === "home") {
    const pages = Math.max(1, Math.ceil(d.count / 48));
    const pageLink = (n: number) => {
      const p = new URLSearchParams(params);
      n === 1 ? p.delete("page") : p.set("page", String(n));
      return "?" + p;
    };
    return (
      <>
        <h1>Pokémon</h1>
        <div className="filters">
          <label>
            Search
            <input
              type="search"
              defaultValue={params.get("q") || ""}
              onChange={(e) => update("q", e.target.value)}
            />
          </label>
          <label>
            Type
            <select
              aria-label="Type"
              value={params.get("type") || ""}
              onChange={(e) => update("type", e.target.value)}
            >
              <option value="">All types</option>
              {d.ts.map((t: any) => (
                <option key={t.name} value={t.name}>
                  {human(t.name)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Generation
            <select
              aria-label="Generation"
              value={params.get("generation") || ""}
              onChange={(e) => update("generation", e.target.value)}
            >
              <option value="">All generations</option>
              {d.gs.map((g: any) => (
                <option key={g.name} value={g.name}>
                  {english(g)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted">{d.count} Pokémon</p>
        {d.count ? (
          <Cards items={d.cards} showTypes />
        ) : (
          <p>No Pokémon found</p>
        )}
        <div className="pagination">
          {d.page > 1 && <Link to={pageLink(d.page - 1)}>Previous page</Link>}
          <span>
            Page {d.page} of {pages}
          </span>
          {d.page < pages && <Link to={pageLink(d.page + 1)}>Next page</Link>}
        </div>
      </>
    );
  }
  if (d.kind === "types" && !d.r)
    return (
      <>
        <h1>Types</h1>
        <ul className="type-list">
          {d.ts.map((t: any) => (
            <li key={t.name}>
              <Type r={t} />
            </li>
          ))}
        </ul>
      </>
    );
  const r = d.r;
  if (d.kind === "pokemon") {
    const p = d.p;
    const methods = [
      ...new Set(
        d.moves.flatMap((m: any) =>
          m.details.map((v: any) => v.move_learn_method.name),
        ),
      ),
    ].sort((a: any, b: any) => {
      const order = ["level-up", "machine", "egg", "tutor"];
      return (
        (order.includes(a) ? order.indexOf(a) : 4) -
          (order.includes(b) ? order.indexOf(b) : 4) || a.localeCompare(b)
      );
    });
    return (
      <>
        <div className="summary">
          <img
            className="artwork"
            src={p.sprites.other["official-artwork"].front_default}
            alt={d.title}
          />
          <div>
            <span className="dex">#{String(r.id).padStart(4, "0")}</span>
            <h1>{d.title}</h1>
            <p className="muted">
              {r.genera.find((x: any) => x.language.name === "en")?.genus}
            </p>
            <div>
              {p.types.map((t: any) => (
                <Type key={t.slot} r={t.type} />
              ))}
            </div>
            <dl className="dimensions">
              <div>
                <dt>Height</dt>
                <dd>{(p.height / 10).toFixed(1)} m</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{(p.weight / 10).toFixed(1)} kg</dd>
              </div>
            </dl>
            <p>{flavor(r)}</p>
          </div>
        </div>
        <Section name="Base stats">
          <table className="stats">
            <tbody>
              {[
                ...p.stats.map((s: any, i: number) => ({
                  label: [
                    "HP",
                    "Attack",
                    "Defense",
                    "Sp. Atk",
                    "Sp. Def",
                    "Speed",
                  ][i],
                  value: s.base_stat,
                })),
                {
                  label: "Total",
                  value: p.stats.reduce(
                    (a: number, s: any) => a + s.base_stat,
                    0,
                  ),
                },
              ].map((s) => (
                <tr key={s.label}>
                  <th scope="row">{s.label}</th>
                  <td>{s.value}</td>
                  <td>
                    <div className="track">
                      <div
                        style={{
                          width: Math.min(100, (s.value / 255) * 100) + "%",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section name="Abilities">
          <ul>
            {p.abilities.map((a: any) => (
              <li key={a.slot}>
                <Link to={"/abilities/" + a.ability.name}>
                  {human(a.ability.name)}
                </Link>
                {a.is_hidden && " (hidden)"}
              </li>
            ))}
          </ul>
        </Section>
        <Section name="Evolution">
          <Evolution node={d.chain} />
        </Section>
        <Section name="Moves" id="moves">
          <label className="game">
            Game{" "}
            <select
              aria-label="Game"
              value={d.game}
              onChange={(e) => update("game", e.target.value)}
            >
              {d.games.map((g: any) => (
                <option key={g.name} value={g.name}>
                  {human(g.name)}
                </option>
              ))}
            </select>
          </label>
          {methods.map((m: any) => (
            <MoveTable
              key={d.game + m}
              name={m}
              rows={d.moves.flatMap((move: any) =>
                move.details
                  .filter((v: any) => v.move_learn_method.name === m)
                  .map((v: any) => ({ ...move, level: v.level_learned_at })),
              )}
            />
          ))}
        </Section>
      </>
    );
  }
  return (
    <>
      <h1>{d.title}</h1>
      {d.kind === "moves" && (
        <dl className="details">
          {["Type", "Category", "Power", "Accuracy", "PP"].map((c, i) => (
            <div key={c}>
              <dt>{c}</dt>
              <dd>
                {i === 0 ? (
                  <Type r={r.type} />
                ) : i === 1 ? (
                  human(r.damage_class.name)
                ) : (
                  val(r[["", "", "power", "accuracy", "pp"][i]])
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {["moves", "abilities"].includes(d.kind) && (
        <Section name="Effect">
          <p>{effect(r)}</p>
        </Section>
      )}
      {d.kind === "types" && (
        <Section name="Damage relations">
          <dl>
            {[
              ["Super effective against", "double_damage_to"],
              ["Not very effective against", "half_damage_to"],
              ["No effect against", "no_damage_to"],
              ["Weak to", "double_damage_from"],
              ["Resists", "half_damage_from"],
              ["Immune to", "no_damage_from"],
            ].map(([label, key]) => (
              <div className="relation" key={key}>
                <dt>{label}</dt>
                <dd>
                  {r.damage_relations[key].length
                    ? r.damage_relations[key].map((t: any) => (
                        <Type key={t.name} r={t} />
                      ))
                    : "None"}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      <Section name={d.kind === "moves" ? "Learned by" : "Pokémon"}>
        <p className="muted">{d.cards.length} Pokémon</p>
        <Cards items={d.cards} />
      </Section>
      {d.kind === "types" && (
        <Section name="Moves">
          <p>{r.moves.length} moves</p>
          <ul className="move-list">
            {[...r.moves]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((m: any) => (
                <li key={m.name}>
                  <Link to={"/moves/" + m.name}>{human(m.name)}</Link>
                </li>
              ))}
          </ul>
        </Section>
      )}
    </>
  );
}
export function ErrorBoundary() {
  return (
    <>
      <h1>Not found</h1>
      <p>
        <Link to="/">Back to Pokémon</Link>
      </p>
    </>
  );
}
