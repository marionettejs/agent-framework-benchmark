import { View, Region, setDomApi } from "marionette";
import HtmlDomApi from "@mnjs/html/marionette";
import { html } from "@mnjs/html";
import {
  get,
  base,
  id,
  human,
  english,
  flavor,
  effect,
  species,
  types,
} from "./api.js";
import "./style.css";
setDomApi(HtmlDomApi);
const badge = (t, link = true) =>
  link
    ? html`<a
        class="badge"
        style=${`--badge:var(--type-${t.name})`}
        href=${`/types/${t.name}`}
        >${human(t.name)}</a
      >`
    : html`<span class="badge" style=${`--badge:var(--type-${t.name})`}
        >${human(t.name)}</span
      >`;
const section = (name, content) =>
  html`<section aria-labelledby=${name.toLowerCase().replaceAll(" ", "-")}>
    <h2 id=${name.toLowerCase().replaceAll(" ", "-")}>${name}</h2>
    ${content}
  </section>`;
const num = (n) => `#${String(n).padStart(4, "0")}`;
const cards = (entries, showTypes = false) =>
  html`<ul class="cards">
    ${entries.map(
      (s) =>
        html`<li>
          <a href=${`/pokemon/${s.name}`}
            ><img
              src=${`${base}/media/sprites/pokemon/${s.id}.png`}
              alt=${human(s.name)}
            /><span class="dex">${num(s.id)}</span
            ><span>${human(s.name)}</span
            >${showTypes ? html`<span class="badges">${s.types.map((t) => badge(t, false))}</span>` : ""}${s.hidden ? html`<span class="hidden">Hidden ability</span>` : ""}</a
          >
        </li>`,
    )}
  </ul>`;
async function referenced(refs) {
  const all = await species();
  const byId = new Map(all.map((s) => [id(s), s]));
  return refs
    .map((x) => ({ ref: x.pokemon || x, hidden: x.is_hidden }))
    .filter((x) => byId.has(id(x.ref)))
    .map((x) => ({ ...byId.get(id(x.ref)), id: id(x.ref), hidden: x.hidden }))
    .sort((a, b) => a.id - b.id);
}
const dl = (rows) =>
  html`<dl>
    ${rows.map(
      ([a, b]) =>
        html`<div>
          <dt>${a}</dt>
          <dd>${b ?? "—"}</dd>
        </div>`,
    )}
  </dl>`;
const Shell = View.extend({
  template: () =>
    html`<header>
        <div class="header-inner">
          <a class="brand" href="/">Pokédex</a>
          <nav><a href="/">Pokémon</a><a href="/types">Types</a></nav>
        </div>
      </header>
      <main></main>
      <footer>
        Data from PokéAPI. Pokémon and Pokémon character names are trademarks of
        Nintendo.
      </footer>`,
  regions: { page: "main" },
});
const shell = new Shell();
new Region({ el: "#app" }).show(shell);
function show(title, content, options = {}) {
  document.title = location.pathname === "/" ? "Pokédex" : `${title} – Pokédex`;
  const Page = View.extend({ template: () => content, ...options });
  const v = new Page();
  shell.showChildView("page", v);
  return v;
}
async function home() {
  const [all, ts, genList] = await Promise.all([
    species(),
    types(),
    get("generation/?limit=100"),
  ]);
  const gens = await Promise.all(genList.results.map((r) => get(r.url)));
  const typeMap = new Map();
  for (const t of ts)
    for (const p of t.pokemon) {
      const n = id(p.pokemon);
      if (!typeMap.has(n)) typeMap.set(n, []);
      typeMap.get(n).push({ name: t.name, slot: p.slot });
    }
  const records = all
    .map((s) => ({
      ...s,
      id: id(s),
      types: (typeMap.get(id(s)) || []).sort((a, b) => a.slot - b.slot),
    }))
    .sort((a, b) => a.id - b.id);
  const Home = View.extend({
    templateContext() {
      const q = new URLSearchParams(location.search);
      const search = q.get("q") || "",
        type = q.get("type") || "",
        generation = q.get("generation") || "";
      const gen = gens.find((g) => g.name === generation);
      const ids = gen ? new Set(gen.pokemon_species.map(id)) : null;
      const filtered = records.filter(
        (s) =>
          human(s.name).toLowerCase().includes(search.toLowerCase()) &&
          (!type || s.types.some((t) => t.name === type)) &&
          (!ids || ids.has(s.id)),
      );
      const total = Math.max(1, Math.ceil(filtered.length / 48));
      const page = Math.min(total, Math.max(1, Number(q.get("page")) || 1));
      const pageUrl = (n) => {
        const u = new URLSearchParams(q);
        if (n === 1) u.delete("page");
        else u.set("page", n);
        return "/" + (u.size ? "?" + u : "");
      };
      return { search, type, generation, filtered, total, page, pageUrl };
    },
    template: ({ search, type, generation, filtered, total, page, pageUrl }) =>
      html`<h1>Pokémon</h1>
        <form class="filters">
          <label>Search<input type="search" name="q" .value=${search} /></label
          ><label
            >Type<select name="type" aria-label="Type">
              <option value="">All types</option>
              ${ts.map((t) => html`<option value=${t.name} ?selected=${type === t.name}>${english(t)}</option>`)}
            </select></label
          ><label
            >Generation<select name="generation" aria-label="Generation">
              <option value="">All generations</option>
              ${gens.map((g) => html`<option value=${g.name} ?selected=${generation === g.name}>${english(g)}</option>`)}
            </select></label
          >
        </form>
        <p class="count">${filtered.length} Pokémon</p>
        ${filtered.length ? cards(filtered.slice((page - 1) * 48, page * 48), true) : html`<p>No Pokémon found</p>`}
        <div class="pagination">
          ${page > 1 ? html`<a href=${pageUrl(page - 1)}>Previous page</a>` : ""}<span
            >Page ${page} of ${total}</span
          >${page < total ? html`<a href=${pageUrl(page + 1)}>Next page</a>` : ""}
        </div>`,
    events: {
      "input input": "filter",
      "change select": "filter",
      "submit form": "submit",
    },
    submit(e) {
      e.preventDefault();
    },
    filter() {
      const q = new URLSearchParams();
      for (const el of this.el.querySelectorAll("input,select"))
        if (el.value) q.set(el.name, el.value);
      history.replaceState(null, "", "/" + (q.size ? "?" + q : ""));
      this.render();
    },
  });
  document.title = "Pokédex";
  shell.showChildView("page", new Home());
}
const tree = (node) =>
  html`<li>
    <a href=${`/pokemon/${node.species.name}`}>${human(node.species.name)}</a>${
      node.evolves_to.length
        ? html`<ul>
            ${node.evolves_to.map(tree)}
          </ul>`
        : ""
    }
  </li>`;
const statLabels = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
async function pokemon(name) {
  const s = await get(`pokemon-species/${name}/`);
  const p = await get(`pokemon/${s.id}/`);
  const [chain, vg] = await Promise.all([
    get(s.evolution_chain.url),
    get("version-group/?limit=1000"),
  ]);
  const groups = await Promise.all(
    vg.results
      .filter((v) =>
        p.moves.some((m) =>
          m.version_group_details.some((d) => d.version_group.name === v.name),
        ),
      )
      .map((v) => get(v.url)),
  );
  groups.sort((a, b) => a.order - b.order);
  const page = show(
    english(s),
    html`<div class="pokemon-intro">
        <img
          class="artwork"
          src=${p.sprites.other["official-artwork"].front_default}
          alt=${english(s)}
        />
        <div>
          <span class="dex">${num(s.id)}</span>
          <h1>${english(s)}</h1>
          <p class="genus">
            ${s.genera.find((g) => g.language.name === "en")?.genus}
          </p>
          <div class="badges">
            ${p.types.sort((a, b) => a.slot - b.slot).map((t) => badge(t.type))}
          </div>
          ${dl([
            ["Height", `${(p.height / 10).toFixed(1)} m`],
            ["Weight", `${(p.weight / 10).toFixed(1)} kg`],
          ])}
          <p>${flavor(s)}</p>
        </div>
      </div>
      ${section(
        "Base stats",
        html`<table class="stats">
          <tbody>
            ${[
              ...p.stats.map((v, i) => [statLabels[i], v.base_stat]),
              ["Total", p.stats.reduce((n, v) => n + v.base_stat, 0)],
            ].map(
              ([label, value]) =>
                html`<tr>
                  <th scope="row">${label}</th>
                  <td>${value}</td>
                  <td class="barcell">
                    <div class="track">
                      <div
                        style=${`width:${(value / (label === "Total" ? 720 : 255)) * 100}%`}
                      ></div>
                    </div>
                  </td>
                </tr>`,
            )}
          </tbody>
        </table>`,
      )}${section(
        "Abilities",
        html`<ul>
          ${p.abilities.sort((a, b) => a.slot - b.slot).map((a) => html`<li><a href=${`/abilities/${a.ability.name}`}>${human(a.ability.name)}</a>${a.is_hidden ? " (hidden)" : ""}</li>`)}
        </ul>`,
      )}${section(
        "Evolution",
        html`<ul>
          ${tree(chain.chain)}
        </ul>`,
      )}
      <section id="moves" aria-labelledby="moves-heading">
        <h2 id="moves-heading">Moves</h2>
        <div class="moves-content"></div>
      </section>`,
    { regions: { moves: ".moves-content" } },
  );
  const moves = new Moves({ pokemon: p, groups });
  page.showChildView("moves", moves);
  await moves.load();
  if (location.hash === "#moves")
    document.getElementById("moves").scrollIntoView();
}
const columns = ["Move", "Type", "Category", "Power", "Accuracy", "PP"];
const Moves = View.extend({
  initialize(o) {
    this.p = o.pokemon;
    this.groups = o.groups;
    this.game =
      new URLSearchParams(location.search).get("game") ||
      this.groups.at(-1)?.name;
    this.tables = [];
    this.sorts = {};
    this.revision = 0;
  },
  templateContext() {
    return { v: this };
  },
  template: ({ v }) =>
    html`<label class="game"
        >Game<select class="game-select" aria-label="Game">
          ${v.groups.map((g) => html`<option value=${g.name} ?selected=${v.game === g.name}>${human(g.name)}</option>`)}
        </select></label
      >${v.tables.map((t) => {
        const cols = t.name === "level-up" ? ["Level", ...columns] : columns;
        return html`<div class="table-scroll">
          <table>
            <caption>
              ${human(t.name)}
            </caption>
            <thead>
              <tr>
                ${cols.map((c) => html`<th data-method=${t.name} data-column=${c} aria-sort=${v.sorts[t.name]?.col === c ? v.sorts[t.name].dir : "none"}><button data-method=${t.name} data-column=${c}>${c}</button></th>`)}
              </tr>
            </thead>
            <tbody>
              ${t.rows.map(
                (r) =>
                  html`<tr>
                    ${cols.map((c) => html`<td>${c === "Move" ? html`<a href=${`/moves/${r.move.name}`}>${r.Move}</a>` : c === "Type" ? badge(r.move.type) : (r[c] ?? "—")}</td>`)}
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>`;
      })}`,
  events: { "change .game-select": "changeGame", "click th": "sort" },
  changeGame(e) {
    this.game = e.target.value;
    const u = new URL(location.href);
    u.searchParams.set("game", this.game);
    history.replaceState(null, "", u);
    this.load().catch(report);
  },
  async load() {
    const rev = ++this.revision;
    const grouped = new Map();
    await Promise.all(
      this.p.moves.map(async (entry) => {
        const ds = entry.version_group_details.filter(
          (d) => d.version_group.name === this.game,
        );
        if (!ds.length) return;
        const m = await get(entry.move.url);
        for (const d of ds) {
          const method = d.move_learn_method.name;
          if (!grouped.has(method)) grouped.set(method, []);
          grouped
            .get(method)
            .push({
              move: m,
              Level: d.level_learned_at,
              Move: english(m),
              Type: human(m.type.name),
              Category: human(m.damage_class.name),
              Power: m.power,
              Accuracy: m.accuracy,
              PP: m.pp,
            });
        }
      }),
    );
    if (rev !== this.revision || this.isDestroyed()) return;
    const priority = ["level-up", "machine", "egg", "tutor"];
    this.tables = [...grouped]
      .sort(
        ([a], [b]) =>
          (priority.includes(a) ? priority.indexOf(a) : 99) -
            (priority.includes(b) ? priority.indexOf(b) : 99) ||
          a.localeCompare(b),
      )
      .map(([name, rows]) => ({
        name,
        rows: rows.sort(
          (a, b) =>
            (name === "level-up" ? a.Level - b.Level : 0) ||
            a.Move.localeCompare(b.Move),
        ),
      }));
    this.sorts = {};
    this.render();
  },
  sort(e) {
    const { method, column } = e.delegateTarget.dataset;
    const dir =
      this.sorts[method]?.col === column &&
      this.sorts[method].dir === "ascending"
        ? "descending"
        : "ascending";
    this.sorts[method] = { col: column, dir };
    this.tables
      .find((t) => t.name === method)
      .rows.sort((a, b) => {
        const x = a[column],
          y = b[column];
        if (x == null) return y == null ? 0 : 1;
        if (y == null) return -1;
        return (
          (typeof x === "number" ? x - y : x.localeCompare(y)) *
          (dir === "ascending" ? 1 : -1)
        );
      });
    this.render();
  },
});
async function detail(kind, name) {
  const resource =
    kind === "moves" ? "move" : kind === "abilities" ? "ability" : "type";
  const r = await get(`${resource}/${name}/`);
  let body;
  if (kind === "moves") {
    const entries = await referenced(r.learned_by_pokemon);
    body = html`${dl([
      ["Type", badge(r.type)],
      ["Category", human(r.damage_class.name)],
      ["Power", r.power],
      ["Accuracy", r.accuracy],
      ["PP", r.pp],
    ])}${section("Effect", html`<p>${effect(r)}</p>`)}${section(
      "Learned by",
      html`<p class="count">${entries.length} Pokémon</p>
        ${cards(entries)}`,
    )}`;
  } else if (kind === "abilities") {
    const entries = await referenced(r.pokemon);
    body = html`${section("Effect", html`<p>${effect(r)}</p>`)}${section(
      "Pokémon",
      html`<p class="count">${entries.length} Pokémon</p>
        ${cards(entries)}`,
    )}`;
  } else {
    const entries = await referenced(r.pokemon);
    const relations = [
      ["Super effective against", "double_damage_to"],
      ["Not very effective against", "half_damage_to"],
      ["No effect against", "no_damage_to"],
      ["Weak to", "double_damage_from"],
      ["Resists", "half_damage_from"],
      ["Immune to", "no_damage_from"],
    ];
    body = html`${section("Damage relations", dl(relations.map(([label, key]) => [label, r.damage_relations[key].length ? html`${r.damage_relations[key].map((t) => badge(t))}` : "None"])))}${section(
      "Pokémon",
      html`<p class="count">${entries.length} Pokémon</p>
        ${cards(entries)}`,
    )}${section(
      "Moves",
      html`<p class="count">${r.moves.length} moves</p>
        <ul class="move-list">
          ${[...r.moves].sort((a, b) => human(a.name).localeCompare(human(b.name))).map((m) => html`<li><a href=${`/moves/${m.name}`}>${human(m.name)}</a></li>`)}
        </ul>`,
    )}`;
  }
  show(
    english(r),
    html`<h1>${english(r)}</h1>
      ${body}`,
  );
}
function report(e) {
  console.error(e);
  show(
    "Unable to load",
    html`<h1>Unable to load</h1>
      <p>Please try again.</p>
      <a href=${location.href}>Retry</a>`,
  );
}
async function route() {
  try {
    const path = location.pathname.replace(/\/$/, "") || "/";
    if (path === "/") await home();
    else if (path === "/types") {
      const ts = await types();
      show(
        "Types",
        html`<h1>Types</h1>
          <ul class="type-list">
            ${ts.map((t) => html`<li>${badge(t)}</li>`)}
          </ul>`,
      );
    } else {
      const match = path.match(/^\/(pokemon|moves|abilities|types)\/([^/]+)$/);
      if (!match) throw new Error("404");
      if (match[1] === "pokemon") await pokemon(match[2]);
      else await detail(match[1], match[2]);
    }
  } catch (e) {
    if (e.message === "404")
      show(
        "Not found",
        html`<h1>Not found</h1>
          <p><a href="/">Back to Pokémon</a></p>`,
      );
    else report(e);
  }
}
window.addEventListener("popstate", route);
await route();
