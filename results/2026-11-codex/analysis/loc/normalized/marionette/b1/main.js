import {
  View,
  Region,
  CollectionView,
  setDomApi,
  setDataApi,
} from "marionette";
import HtmlDomApi from "@mnjs/html/marionette";
import { html } from "@mnjs/html";
import { Collection, DataApi } from "@mnjs/data";
import "./style.css";
setDomApi(HtmlDomApi);
setDataApi(DataApi);
const base = import.meta.env.API_BASE_URL;
const cache = new Map();
function api(resource) {
  const url = resource.startsWith("http")
    ? resource
    : `${base}/api/v2/${resource}`;
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw Error(r.status === 404 ? "404" : "API unavailable");
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
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
const english = (r) =>
  r.names?.find((n) => n.language.name === "en")?.name || human(r.name);
const flavor = (r) =>
  (
    r.flavor_text_entries?.filter((e) => e.language.name === "en").at(-1)
      ?.flavor_text || "—"
  ).replace(/\s+/g, " ");
const effect = (r) =>
  r.effect_entries?.find((e) => e.language.name === "en")?.short_effect ||
  flavor(r);
const id = (r) => Number(r.url.match(/\/(\d+)\/?$/)?.[1]);
const dex = (n) => "#" + String(n).padStart(4, "0");
const val = (n) => n ?? "—";
const typeLink = (t) =>
  html`<a
    class="badge"
    style=${`background:var(--type-${t.name})`}
    href=${`/types/${t.name}`}
    >${human(t.name)}</a
  >`;
const badge = (t) =>
  html`<span class="badge" style=${`background:var(--type-${t.name})`}
    >${human(t.name)}</span
  >`;
const section = (
  title,
  body,
  slug = title.toLowerCase().replaceAll(" ", "-"),
) =>
  html`<section id=${slug} aria-labelledby=${slug + "-heading"}>
    <h2 id=${slug + "-heading"}>${title}</h2>
    ${body}
  </section>`;
const shell = new View({
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
new Region({ el: "#app" }).show(shell);
const Card = View.extend({
  tagName: "li",
  template: (p) =>
    html`<a class="card" href=${"/pokemon/" + p.name}
      ><img src=${p.sprite} alt=${human(p.name)} /><span class="dex"
        >${dex(p.id)}</span
      ><span>${human(p.name)}</span
      >${p.types ? html`<span>${p.types.map((t) => badge(t.type))}</span>` : ""}${p.hidden ? html`<small>Hidden ability</small>` : ""}</a
    >`,
});
const Cards = CollectionView.extend({
  tagName: "ul",
  className: "cards",
  childView: Card,
});
function showCards(view, rows) {
  view.showChildView("cards", new Cards({ collection: new Collection(rows) }));
}
async function speciesList() {
  return (await api("pokemon-species/?limit=100000")).results;
}
async function cardRows(refs, types = false) {
  const species = await speciesList();
  const byId = new Map(species.map((s) => [id(s), s]));
  const rows = refs
    .map((r) => ({ ref: r.pokemon || r, hidden: r.is_hidden }))
    .filter((r) => byId.has(id(r.ref)))
    .sort((a, b) => id(a.ref) - id(b.ref));
  return Promise.all(
    rows.map(async (r) => {
      const n = id(r.ref),
        s = byId.get(n);
      const p = types ? await api(`pokemon/${n}/`) : null;
      return {
        id: n,
        name: s.name,
        sprite:
          p?.sprites.front_default || `${base}/media/sprites/pokemon/${n}.png`,
        types: p?.types,
        hidden: r.hidden,
      };
    }),
  );
}
const title = (t) => {
  document.title = location.pathname === "/" ? "Pokédex" : `${t} – Pokédex`;
};
const Home = View.extend({
  initialize() {
    this.revision = 0;
    this.params = new URLSearchParams(location.search);
  },
  templateContext() {
    return {
      p: this.params,
      types: this.types || [],
      gens: this.gens || [],
      count: this.count,
      page: this.page,
      total: this.total,
    };
  },
  template: ({ p, types, gens, count, page, total }) =>
    html`<h1>Pokémon</h1>
      <div class="filters" ?hidden=${!types.length}>
        <label
          >Search<input
            type="search"
            name="q"
            .value=${p.get("q") || ""} /></label
        ><label
          >Type<select aria-label="Type" name="type">
            <option value="">All types</option>
            ${types.map((t) => html`<option value=${t.name} ?selected=${p.get("type") === t.name}>${english(t)}</option>`)}
          </select></label
        ><label
          >Generation<select aria-label="Generation" name="generation">
            <option value="">All generations</option>
            ${gens.map((g) => html`<option value=${g.name} ?selected=${p.get("generation") === g.name}>${english(g)}</option>`)}
          </select></label
        >
      </div>
      ${count === undefined ? html`<p role="status">Loading…</p>` : html`<p class="muted">${count} Pokémon</p>`}
      <div class="results"></div>
      ${count === 0 ? html`<p>No Pokémon found</p>` : ""}${count ? html`<div class="pagination">${page > 1 ? html`<a href=${pageUrl(p, page - 1)}>Previous page</a>` : ""}<span>Page ${page} of ${total}</span>${page < total ? html`<a href=${pageUrl(p, page + 1)}>Next page</a>` : ""}</div>` : ""}`,
  regions: { cards: ".results" },
  events: { "input input": "filter", "change select": "filter" },
  filter(e) {
    const el = e.delegateTarget;
    this.params.set(el.name, el.value);
    if (!el.value) this.params.delete(el.name);
    this.params.delete("page");
    history.replaceState(null, "", pageUrl(this.params, 1));
    this.load().catch(report);
  },
  async load() {
    const rev = ++this.revision;
    const [species, types, gens] = await Promise.all([
      speciesList(),
      typeList(),
      generationList(),
    ]);
    this.types = types;
    this.gens = gens;
    const p = this.params;
    let refs = species.filter((s) =>
      human(s.name)
        .toLowerCase()
        .includes((p.get("q") || "").toLowerCase()),
    );
    if (p.get("type")) {
      const t = await api(`type/${p.get("type")}/`);
      const ids = new Set(t.pokemon.map((r) => id(r.pokemon)));
      refs = refs.filter((s) => ids.has(id(s)));
    }
    if (p.get("generation")) {
      const g = await api(`generation/${p.get("generation")}/`);
      const ids = new Set(g.pokemon_species.map(id));
      refs = refs.filter((s) => ids.has(id(s)));
    }
    const count = refs.length,
      total = Math.max(1, Math.ceil(count / 48)),
      page = Math.min(total, Math.max(1, Number(p.get("page")) || 1));
    const rows = await cardRows(refs.slice((page - 1) * 48, page * 48), true);
    if (rev !== this.revision || this.isDestroyed()) return;
    Object.assign(this, { count, total, page });
    this.render();
    showCards(this, rows);
  },
});
function pageUrl(p, n) {
  const q = new URLSearchParams(p);
  if (n > 1) q.set("page", n);
  else q.delete("page");
  return "/" + (q.size ? "?" + q : "");
}
async function typeList() {
  return Promise.all(
    (await api("type/?limit=100")).results
      .filter((t) => !["stellar", "unknown", "shadow"].includes(t.name))
      .map((t) => api(t.url)),
  );
}
async function generationList() {
  return Promise.all(
    (await api("generation/?limit=100")).results.map((g) => api(g.url)),
  );
}
function evolution(node) {
  return html`<li>
    <a href=${"/pokemon/" + node.species.name}>${human(node.species.name)}</a>${
      node.evolves_to.length
        ? html`<ul>
            ${node.evolves_to.map(evolution)}
          </ul>`
        : ""
    }
  </li>`;
}
const statNames = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
const Pokemon = View.extend({
  templateContext() {
    return {
      s: this.getOption("species"),
      p: this.getOption("pokemon"),
      chain: this.getOption("chain"),
    };
  },
  template: ({ s, p, chain }) =>
    html`<div class="summary">
        <img
          class="artwork"
          src=${p.sprites.other["official-artwork"].front_default || p.sprites.front_default}
          alt=${english(s)}
        />
        <div>
          <span class="dex">${dex(s.id)}</span>
          <h1>${english(s)}</h1>
          <p class="muted genus">
            ${s.genera.find((g) => g.language.name === "en")?.genus || "—"}
          </p>
          <div>${p.types.map((t) => typeLink(t.type))}</div>
          <dl class="metrics">
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
            ${[
              ...p.stats.map((r, i) => [statNames[i], r.base_stat]),
              ["Total", p.stats.reduce((n, r) => n + r.base_stat, 0)],
            ].map(
              ([name, n]) =>
                html`<tr>
                  <th scope="row">${name}</th>
                  <td>${n}</td>
                  <td>
                    <div class="track">
                      <div
                        style=${`width:${(n / (name === "Total" ? 780 : 255)) * 100}%`}
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
          ${p.abilities.map((a) => html`<li><a href=${"/abilities/" + a.ability.name}>${human(a.ability.name)}</a> ${a.is_hidden ? "(hidden)" : ""}</li>`)}
        </ul>`,
      )}${section(
        "Evolution",
        html`<ul>
          ${evolution(chain.chain)}
        </ul>`,
      )}
      <div class="moves-region"></div>`,
  regions: { moves: ".moves-region" },
});
const Moves = View.extend({
  initialize() {
    this.sorts = {};
    this.game =
      new URLSearchParams(location.search).get("game") ||
      this.getOption("games").at(-1)?.name;
  },
  templateContext() {
    return {
      owner: this,
      games: this.getOption("games"),
      game: this.game,
      tables: this.tables(),
    };
  },
  template: ({ owner, games, game, tables }) =>
    section(
      "Moves",
      html`<label class="game-label"
          >Game<select aria-label="Game" name="game">
            ${games.map((g) => html`<option value=${g.name} ?selected=${game === g.name}>${human(g.name)}</option>`)}
          </select></label
        >${tables.map(
          ([method, rows]) =>
            html`<div class="table-wrap">
              <table>
                <caption>
                  ${human(method)}
                </caption>
                <thead>
                  <tr>
                    ${columns(method).map((col) => html`<th scope="col" data-method=${method} data-col=${col} aria-sort=${owner.sorts[method]?.col === col ? owner.sorts[method].dir : "none"}><button data-method=${method} data-col=${col}>${col}</button></th>`)}
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(
                    (r) =>
                      html`<tr>
                        ${columns(method).map((col) => html`<td>${col === "Move" ? html`<a href=${"/moves/" + r.move.name}>${english(r.move)}</a>` : col === "Type" ? typeLink(r.move.type) : val(moveValue(r, col))}</td>`)}
                      </tr>`,
                  )}
                </tbody>
              </table>
            </div>`,
        )}`,
    ),
  events: { "change select": "changeGame", "click th": "sort" },
  changeGame(e) {
    this.game = e.delegateTarget.value;
    this.sorts = {};
    const url = new URL(location.href);
    url.searchParams.set("game", this.game);
    history.replaceState(null, "", url);
    this.render();
  },
  sort(e) {
    const { method, col } = e.delegateTarget.dataset;
    const old = this.sorts[method];
    this.sorts[method] = {
      col,
      dir:
        old?.col === col && old.dir === "ascending"
          ? "descending"
          : "ascending",
    };
    this.render();
  },
  tables() {
    const methods = {};
    for (const m of this.getOption("pokemon").moves) {
      for (const d of m.version_group_details.filter(
        (d) => d.version_group.name === this.game,
      )) {
        (methods[d.move_learn_method.name] ??= []).push({
          move: this.getOption("moves").get(m.move.name),
          level: d.level_learned_at,
        });
      }
    }
    const priority = ["level-up", "machine", "egg", "tutor"];
    return Object.entries(methods)
      .sort(([a], [b]) => {
        const ai = priority.indexOf(a),
          bi = priority.indexOf(b);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.localeCompare(b);
      })
      .map(([method, rows]) => {
        const sort = this.sorts[method];
        rows.sort((a, b) => {
          if (!sort)
            return (
              (method === "level-up" ? a.level - b.level : 0) ||
              english(a.move).localeCompare(english(b.move))
            );
          const av = moveValue(a, sort.col),
            bv = moveValue(b, sort.col);
          if (av == null) return bv == null ? 0 : 1;
          if (bv == null) return -1;
          return (
            (typeof av === "number"
              ? av - bv
              : String(av).localeCompare(String(bv))) *
            (sort.dir === "ascending" ? 1 : -1)
          );
        });
        return [method, rows];
      });
  },
});
const columns = (method) => [
  ...(method === "level-up" ? ["Level"] : []),
  "Move",
  "Type",
  "Category",
  "Power",
  "Accuracy",
  "PP",
];
function moveValue(r, col) {
  return {
    Level: r.level,
    Move: english(r.move),
    Type: human(r.move.type.name),
    Category: human(r.move.damage_class.name),
    Power: r.move.power,
    Accuracy: r.move.accuracy,
    PP: r.move.pp,
  }[col];
}
async function pokemonPage(name) {
  const s = await api(`pokemon-species/${name}/`);
  const [p, chain] = await Promise.all([
    api(`pokemon/${s.id}/`),
    api(s.evolution_chain.url),
  ]);
  const gameNames = [
    ...new Map(
      p.moves.flatMap((m) =>
        m.version_group_details.map((d) => [
          d.version_group.name,
          d.version_group,
        ]),
      ),
    ).values(),
  ];
  const [games, details] = await Promise.all([
    Promise.all(gameNames.map((g) => api(g.url))),
    Promise.all(p.moves.map((m) => api(m.move.url))),
  ]);
  games.sort((a, b) => a.order - b.order);
  title(english(s));
  const view = new Pokemon({ species: s, pokemon: p, chain });
  shell.showChildView("page", view);
  view.showChildView(
    "moves",
    new Moves({
      pokemon: p,
      games,
      moves: new Map(details.map((m) => [m.name, m])),
    }),
  );
  if (location.hash)
    requestAnimationFrame(() =>
      document.getElementById(location.hash.slice(1))?.scrollIntoView(),
    );
}
async function detailPage(kind, name) {
  const resource = { moves: "move", abilities: "ability", types: "type" }[kind];
  const data = await api(`${resource}/${name}/`);
  if (kind === "types" && ["stellar", "unknown", "shadow"].includes(name))
    throw Error("404");
  const refs = kind === "moves" ? data.learned_by_pokemon : data.pokemon;
  const rows = await cardRows(refs);
  title(english(data));
  const view = new View({
    template: () =>
      html`<h1>${english(data)}</h1>
        ${
          kind === "moves"
            ? html`<dl class="properties">
                ${[
                  ["Type", typeLink(data.type)],
                  ["Category", human(data.damage_class.name)],
                  ["Power", val(data.power)],
                  ["Accuracy", val(data.accuracy)],
                  ["PP", val(data.pp)],
                ].map(
                  ([label, value]) =>
                    html`<div>
                      <dt>${label}</dt>
                      <dd>${value}</dd>
                    </div>`,
                )}
              </dl>`
            : ""
        }${
          kind === "types"
            ? section(
                "Damage relations",
                html`<dl class="relations">
                  ${[
                    ["Super effective against", "double_damage_to"],
                    ["Not very effective against", "half_damage_to"],
                    ["No effect against", "no_damage_to"],
                    ["Weak to", "double_damage_from"],
                    ["Resists", "half_damage_from"],
                    ["Immune to", "no_damage_from"],
                  ].map(
                    ([label, key]) =>
                      html`<div>
                        <dt>${label}</dt>
                        <dd>
                          ${data.damage_relations[key].length ? data.damage_relations[key].map(typeLink) : "None"}
                        </dd>
                      </div>`,
                  )}
                </dl>`,
              )
            : section("Effect", html`<p>${effect(data)}</p>`)
        }${section(
          kind === "moves" ? "Learned by" : "Pokémon",
          html`<p class="muted">${rows.length} Pokémon</p>
            <div class="card-region"></div>`,
        )}${
          kind === "types"
            ? section(
                "Moves",
                html`<p class="muted">${data.moves.length} moves</p>
                  <ul class="move-list">
                    ${[...data.moves].sort((a, b) => human(a.name).localeCompare(human(b.name))).map((m) => html`<li><a href=${"/moves/" + m.name}>${human(m.name)}</a></li>`)}
                  </ul>`,
              )
            : ""
        }`,
    regions: { cards: ".card-region" },
  });
  shell.showChildView("page", view);
  showCards(view, rows);
}
function report(e) {
  console.error(e);
  title(e.message === "404" ? "Not found" : "Unable to load");
  shell.showChildView(
    "page",
    new View({
      template: () =>
        html`<h1>${e.message === "404" ? "Not found" : "Unable to load"}</h1>
          <p><a href="/">Back to Pokémon</a></p>`,
    }),
  );
}
async function start() {
  const path = location.pathname.split("/").filter(Boolean);
  if (!path.length) {
    title("Pokémon");
    const view = new Home();
    shell.showChildView("page", view);
    await view.load();
  } else if (path.length === 1 && path[0] === "types") {
    const types = await typeList();
    title("Types");
    shell.showChildView(
      "page",
      new View({
        template: () =>
          html`<h1>Types</h1>
            <ul class="type-list">
              ${types.map((t) => html`<li>${typeLink(t)}</li>`)}
            </ul>`,
      }),
    );
  } else if (path.length === 2 && path[0] === "pokemon")
    await pokemonPage(path[1]);
  else if (
    path.length === 2 &&
    ["moves", "abilities", "types"].includes(path[0])
  )
    await detailPage(...path);
  else throw Error("404");
}
start().catch(report);
