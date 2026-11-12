import {
  View,
  Region,
  CollectionView,
  setDomApi,
  setDataApi,
} from "marionette";
import { Collection, DataApi } from "@mnjs/data";
import HtmlDomApi from "@mnjs/html/marionette";
import { html } from "@mnjs/html";
import "./style.css";
setDomApi(HtmlDomApi);
setDataApi(DataApi);
const { api } = await fetch("/config.json").then((r) => r.json());
const cache = new Map();
function get(resource) {
  const url = resource.startsWith("http")
    ? resource
    : `${api}/api/v2/${resource}`;
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok)
            throw new Error(r.status === 404 ? "404" : "API unavailable");
          return r.json();
        })
        .catch((e) => {
          cache.delete(url);
          throw e;
        }),
    );
  return cache.get(url);
}
const human = (s) =>
  s
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");
const english = (r) =>
  r.names?.find((n) => n.language.name === "en")?.name || human(r.name);
const idOf = (r) => Number(r.url.match(/\/(\d+)\/?$/)?.[1]);
const flavor = (r) =>
  r.flavor_text_entries
    ?.filter((e) => e.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ") || "—";
const num = (id) => "#" + String(id).padStart(4, "0");
const val = (n) => n ?? "—";
const typeLink = (t) =>
  html`<a
    class="badge"
    style=${`--badge:var(--type-${t.name})`}
    href=${`/types/${t.name}`}
    >${typeNames.get(t.name) || human(t.name)}</a
  >`;
let typeNames = new Map(),
  species = [];
const speciesPromise = get("pokemon-species/?limit=10000").then(
  (r) =>
    (species = r.results
      .map((r) => ({ ...r, id: idOf(r) }))
      .sort((a, b) => a.id - b.id)),
);
const typesPromise = get("type/?limit=100")
  .then((r) =>
    Promise.all(
      r.results
        .filter((t) => !["stellar", "unknown", "shadow"].includes(t.name))
        .map((t) => get(t.url)),
    ),
  )
  .then((ts) => {
    ts.forEach((t) => typeNames.set(t.name, english(t)));
    return ts;
  });
const Card = View.extend({
  tagName: "li",
  className: "card",
  template: (d) =>
    html`<a href=${`/pokemon/${d.name}`}
      ><img
        src=${`${api}/media/sprites/pokemon/${d.id}.png`}
        alt=""
        width="96"
        height="96"
      /><span class="dex">${num(d.id)}</span
      ><span>${human(d.name)}</span
      >${d.types ? html`<span class="badges">${d.types.map((t) => html`<span class="badge" style=${`--badge:var(--type-${t})`}>${typeNames.get(t)}</span>`)}</span>` : ""}${d.hidden ? html`<span class="muted">Hidden ability</span>` : ""}</a
    >`,
});
const Cards = CollectionView.extend({
  tagName: "ul",
  className: "cards",
  childView: Card,
  onDestroy() {
    this.collection.destroy();
  },
});
function cardData(refs) {
  return refs
    .map((r) => ({ id: idOf(r.pokemon || r), hidden: r.is_hidden }))
    .filter((r) => species.some((s) => s.id === r.id))
    .map((r) => ({ ...species.find((s) => s.id === r.id), hidden: r.hidden }))
    .sort((a, b) => a.id - b.id);
}
const Shell = View.extend({
  template: () =>
    html`<header>
        <div>
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
const root = new Region({ el: "#app" });
const shell = new Shell();
root.show(shell);
function title(t, home = false) {
  document.title = home ? "Pokédex" : `${t} – Pokédex`;
}
function show(template, options = {}) {
  const page = new View({ template: () => template, ...options });
  shell.showChildView("page", page);
  return page;
}
function section(name, body) {
  return html`<section aria-label=${name}>
    <h2>${name}</h2>
    ${body}
  </section>`;
}
function mountCards(page, rows) {
  page.addRegion("cards", ".card-host");
  page.showChildView("cards", new Cards({ collection: new Collection(rows) }));
}
const Home = View.extend({
  initialize({ types, gens }) {
    this.types = types;
    this.gens = gens;
    this.pokemonTypes = new Map();
    types.forEach((t) =>
      t.pokemon.forEach((p) => {
        const id = idOf(p.pokemon);
        if (!this.pokemonTypes.has(id)) this.pokemonTypes.set(id, []);
        this.pokemonTypes.get(id).push({ slot: p.slot, name: t.name });
      }),
    );
  },
  templateContext() {
    const q = new URLSearchParams(location.search);
    let rows = species.filter((s) =>
      human(s.name)
        .toLowerCase()
        .includes((q.get("q") || "").toLowerCase()),
    );
    if (q.get("type"))
      rows = rows.filter((s) =>
        this.pokemonTypes.get(s.id)?.some((t) => t.name === q.get("type")),
      );
    if (q.get("generation")) {
      const gen = this.gens.find((g) => g.name === q.get("generation"));
      if (gen) {
        const ids = new Set(gen.pokemon_species.map(idOf));
        rows = rows.filter((s) => ids.has(s.id));
      }
    }
    const total = Math.max(1, Math.ceil(rows.length / 48));
    const current = Math.min(total, Math.max(1, Number(q.get("page")) || 1));
    this.rows = rows.slice((current - 1) * 48, current * 48).map((s) => ({
      ...s,
      types: (this.pokemonTypes.get(s.id) || [])
        .sort((a, b) => a.slot - b.slot)
        .map((t) => t.name),
    }));
    const href = (p) => {
      const copy = new URLSearchParams(q);
      p === 1 ? copy.delete("page") : copy.set("page", p);
      return "/" + (copy.size ? "?" + copy : "");
    };
    return {
      q,
      types: this.types,
      gens: this.gens,
      count: rows.length,
      current,
      total,
      href,
    };
  },
  template: ({ q, types, gens, count, current, total, href }) =>
    html`<h1>Pokémon</h1>
      <div class="filters">
        <label
          >Search<input type="search" name="q" .value=${q.get("q") || ""}
        /></label>
        <div class="filter">
          <label for="type">Type</label
          ><select id="type" name="type">
            <option value="">All types</option>
            ${types.map((t) => html`<option value=${t.name} ?selected=${q.get("type") === t.name}>${english(t)}</option>`)}
          </select>
        </div>
        <div class="filter">
          <label for="generation">Generation</label
          ><select id="generation" name="generation">
            <option value="">All generations</option>
            ${gens.map((g) => html`<option value=${g.name} ?selected=${q.get("generation") === g.name}>${english(g)}</option>`)}
          </select>
        </div>
      </div>
      <p class="muted count">${count} Pokémon</p>
      ${count ? html`<div class="card-host"></div>` : html`<p>No Pokémon found</p>`}
      <div class="pagination">
        ${current > 1 ? html`<a href=${href(current - 1)}>Previous page</a>` : ""}<span
          >Page ${current} of ${total}</span
        >${current < total ? html`<a href=${href(current + 1)}>Next page</a>` : ""}
      </div>`,
  events: { "input input": "filter", "change select": "filter" },
  filter(e) {
    const q = new URLSearchParams(location.search);
    e.delegateTarget.value
      ? q.set(e.delegateTarget.name, e.delegateTarget.value)
      : q.delete(e.delegateTarget.name);
    q.delete("page");
    history.replaceState({}, "", "/" + (q.size ? "?" + q : ""));
    this.render();
  },
  onBeforeRender() {
    if (this.getRegion("cards")) this.removeRegion("cards");
  },
  onRender() {
    if (this.rows.length) {
      this.addRegion("cards", ".card-host");
      this.showChildView(
        "cards",
        new Cards({ collection: new Collection(this.rows) }),
      );
    }
  },
});
function evolution(node) {
  return html`<li>
    <a href=${`/pokemon/${node.species.name}`}>${human(node.species.name)}</a>${
      node.evolves_to.length
        ? html`<ul>
            ${node.evolves_to.map(evolution)}
          </ul>`
        : ""
    }
  </li>`;
}
const columns = {
  level: "Level",
  move: "Move",
  type: "Type",
  category: "Category",
  power: "Power",
  accuracy: "Accuracy",
  pp: "PP",
};
const MoveTable = View.extend({
  initialize({ method, rows }) {
    this.method = method;
    this.rows = rows;
    this.key = method === "level-up" ? "level" : "move";
    this.dir = 1;
    this.sorted = false;
  },
  templateContext() {
    return { view: this };
  },
  template: ({ view: v }) => {
    const cols = Object.keys(columns).filter(
      (k) => k !== "level" || v.method === "level-up",
    );
    const rows = [...v.rows].sort((a, b) => {
      const x = a[v.key],
        y = b[v.key];
      if (x == null) return y == null ? 0 : 1;
      if (y == null) return -1;
      return (
        (typeof x === "number" ? x - y : x.localeCompare(y)) * v.dir ||
        a.move.localeCompare(b.move)
      );
    });
    return html`<div class="table-scroll">
      <table>
        <caption>
          ${human(v.method)}
        </caption>
        <thead>
          <tr>
            ${cols.map((c) => html`<th scope="col" data-key=${c} aria-sort=${v.sorted && v.key === c ? (v.dir === 1 ? "ascending" : "descending") : "none"}><button data-key=${c}>${columns[c]}</button></th>`)}
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (r) =>
              html`<tr>
                ${cols.map((c) => html`<td>${c === "move" ? html`<a href=${`/moves/${r.name}`}>${r.move}</a>` : c === "type" ? typeLink({ name: r.typeName }) : val(r[c])}</td>`)}
              </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  },
  events: { "click th": "sort" },
  sort(e) {
    const key = e.delegateTarget.dataset.key;
    this.dir = this.sorted && this.key === key ? -this.dir : 1;
    this.key = key;
    this.sorted = true;
    this.render();
  },
});
const Moves = View.extend({
  initialize({ pokemon, games, moves }) {
    this.pokemon = pokemon;
    this.games = games;
    this.moves = moves;
    this.game = new URLSearchParams(location.search).get("game");
    if (!games.some((g) => g.name === this.game))
      this.game = games.at(-1)?.name;
  },
  templateContext() {
    return { games: this.games, game: this.game };
  },
  template: ({ games, game }) =>
    html`<h2>Moves</h2>
      <div class="game">
        <label for="game">Game</label
        ><select id="game" name="game">
          ${games.map((g) => html`<option value=${g.name} ?selected=${game === g.name}>${human(g.name)}</option>`)}
        </select>
      </div>
      <div class="tables"></div>`,
  events: { "change select": "changeGame" },
  changeGame(e) {
    this.game = e.delegateTarget.value;
    const url = new URL(location.href);
    url.searchParams.set("game", this.game);
    history.replaceState({}, "", url);
    this.render();
  },
  onBeforeRender() {
    if (this.getRegion("tables")) this.removeRegion("tables");
  },
  onRender() {
    const methods = new Map();
    this.pokemon.moves.forEach((pm) =>
      pm.version_group_details
        .filter((d) => d.version_group.name === this.game)
        .forEach((d) => {
          const m = this.moves.get(pm.move.name);
          const method = d.move_learn_method.name;
          if (!methods.has(method)) methods.set(method, []);
          methods.get(method).push({
            name: m.name,
            move: english(m),
            type: typeNames.get(m.type.name) || human(m.type.name),
            typeName: m.type.name,
            category: human(m.damage_class.name),
            power: m.power,
            accuracy: m.accuracy,
            pp: m.pp,
            level: d.level_learned_at,
          });
        }),
    );
    const order = ["level-up", "machine", "egg", "tutor"];
    const names = [...methods.keys()].sort((a, b) => {
      const rank = (n) => (order.includes(n) ? order.indexOf(n) : 4);
      return rank(a) - rank(b) || a.localeCompare(b);
    });
    const Tables = View.extend({
      template: () =>
        html`${names.map((n) => html`<div class=${"table-" + n}></div>`)}`,
      onRender() {
        names.forEach((n) => {
          this.addRegion(n, ".table-" + n);
          this.showChildView(
            n,
            new MoveTable({ method: n, rows: methods.get(n) }),
          );
        });
      },
    });
    this.addRegion("tables", ".tables");
    this.showChildView("tables", new Tables());
  },
});
async function pokemonPage(name) {
  const s = await get(`pokemon-species/${name}/`);
  const p = await get(`pokemon/${s.id}/`);
  const [chain, allGames, moveRecords] = await Promise.all([
    get(s.evolution_chain.url),
    Promise.all(
      [
        ...new Map(
          p.moves.flatMap((m) =>
            m.version_group_details.map((d) => [
              d.version_group.name,
              d.version_group,
            ]),
          ),
        ).values(),
      ].map((g) => get(g.url)),
    ),
    Promise.all(p.moves.map((m) => get(m.move.url))),
  ]);
  title(english(s));
  const stats = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
  const rows = p.stats.map((s, i) => ({ name: stats[i], value: s.base_stat }));
  rows.push({
    name: "Total",
    value: rows.reduce((sum, r) => sum + r.value, 0),
  });
  const page = show(
    html`<div class="summary">
        <img
          class="artwork"
          src=${p.sprites.other["official-artwork"].front_default || p.sprites.front_default}
          alt=${english(s)}
        />
        <div>
          <span class="dex">${num(s.id)}</span>
          <h1>${english(s)}</h1>
          <p class="muted genus">
            ${s.genera.find((g) => g.language.name === "en")?.genus}
          </p>
          <div class="badges">
            ${p.types.sort((a, b) => a.slot - b.slot).map((t) => typeLink(t.type))}
          </div>
          <dl class="measurements">
            <div>
              <dt>Height</dt>
              <dd>${(p.height / 10).toFixed(1)} m</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>${(p.weight / 10).toFixed(1)} kg</dd>
            </div>
          </dl>
          <p>${flavor(s)}</p>
        </div>
      </div>
      ${section(
        "Base stats",
        html`<table class="stats">
          <tbody>
            ${rows.map(
              (r) =>
                html`<tr>
                  <th scope="row">${r.name}</th>
                  <td>${r.value}</td>
                  <td>
                    <div class="track">
                      <div
                        style=${`width:${(r.value / (r.name === "Total" ? 1200 : 255)) * 100}%`}
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
          ${evolution(chain.chain)}
        </ul>`,
      )}
      <section id="moves" aria-label="Moves" class="moves-host"></section>`,
  );
  page.addRegion("moves", ".moves-host");
  page.showChildView(
    "moves",
    new Moves({
      pokemon: p,
      games: allGames.sort((a, b) => a.order - b.order),
      moves: new Map(moveRecords.map((m) => [m.name, m])),
    }),
  );
  if (location.hash === "#moves")
    requestAnimationFrame(() =>
      document.getElementById("moves").scrollIntoView(),
    );
}
async function detailPage(kind, name) {
  const resource = { moves: "move", abilities: "ability", types: "type" }[kind];
  const r = await get(`${resource}/${name}/`);
  if (kind === "types" && !typeNames.has(name)) throw new Error("404");
  title(english(r));
  let content, refs;
  if (kind === "moves") {
    refs = r.learned_by_pokemon;
    content = html`<dl class="details">
        ${[
          ["Type", typeLink(r.type)],
          ["Category", human(r.damage_class.name)],
          ["Power", val(r.power)],
          ["Accuracy", val(r.accuracy)],
          ["PP", val(r.pp)],
        ].map(
          ([k, v]) =>
            html`<div>
              <dt>${k}</dt>
              <dd>${v}</dd>
            </div>`,
        )}
      </dl>
      ${section("Effect", html`<p>${r.effect_entries.find((e) => e.language.name === "en")?.short_effect || flavor(r)}</p>`)}`;
  }
  if (kind === "abilities") {
    refs = r.pokemon;
    content = section(
      "Effect",
      html`<p>
        ${r.effect_entries.find((e) => e.language.name === "en")?.short_effect || "—"}
      </p>`,
    );
  }
  if (kind === "types") {
    refs = r.pokemon;
    const labels = [
      "Super effective against",
      "Not very effective against",
      "No effect against",
      "Weak to",
      "Resists",
      "Immune to",
    ];
    const keys = [
      "double_damage_to",
      "half_damage_to",
      "no_damage_to",
      "double_damage_from",
      "half_damage_from",
      "no_damage_from",
    ];
    content = section(
      "Damage relations",
      html`<dl class="relations">
        ${keys.map(
          (k, i) =>
            html`<div>
              <dt>${labels[i]}</dt>
              <dd>
                ${r.damage_relations[k].length ? [...r.damage_relations[k]].sort((a, b) => a.name.localeCompare(b.name)).map(typeLink) : "None"}
              </dd>
            </div>`,
        )}
      </dl>`,
    );
  }
  const rows = cardData(refs);
  const page = show(
    html`<h1>${english(r)}</h1>
      ${content}${section(
        kind === "moves" ? "Learned by" : "Pokémon",
        html`<p class="muted count">${rows.length} Pokémon</p>
          <div class="card-host"></div>`,
      )}${
        kind === "types"
          ? section(
              "Moves",
              html`<p class="muted">${r.moves.length} moves</p>
                <ul class="move-list">
                  ${[...r.moves].sort((a, b) => a.name.localeCompare(b.name)).map((m) => html`<li><a href=${`/moves/${m.name}`}>${human(m.name)}</a></li>`)}
                </ul>`,
            )
          : ""
      }`,
  );
  mountCards(page, rows);
}
async function start() {
  await Promise.all([speciesPromise, typesPromise]);
  const types = await typesPromise;
  const path = location.pathname.replace(/\/$/, "") || "/";
  if (path === "/") {
    const list = await get("generation/?limit=100");
    const gens = await Promise.all(list.results.map((g) => get(g.url)));
    title("Pokémon", true);
    shell.showChildView("page", new Home({ types, gens }));
  } else if (path === "/types") {
    title("Types");
    show(
      html`<h1>Types</h1>
        <ul class="type-list">
          ${types.map((t) => html`<li>${typeLink(t)}</li>`)}
        </ul>`,
    );
  } else {
    const m = path.match(/^\/(pokemon|moves|abilities|types)\/([^/]+)$/);
    if (!m) throw new Error("404");
    if (m[1] === "pokemon") await pokemonPage(m[2]);
    else await detailPage(m[1], m[2]);
  }
}
start().catch((e) => {
  console.error(e);
  const missing = e.message === "404";
  title(missing ? "Not found" : "Unable to load");
  show(
    html`<h1>${missing ? "Not found" : "Unable to load"}</h1>
      <p>
        ${missing ? "The page you requested could not be found." : "Please try again."}
      </p>
      <a href="/">Back to Pokémon</a>`,
  );
});
