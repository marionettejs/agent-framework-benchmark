<script>
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Cards from "#lib/Cards.svelte";
  import MoveTable from "#lib/MoveTable.svelte";
  import { human, dex, english } from "#lib/utils.js";
  import "#lib/style.css";
  let { data } = $props();
  let timer;
  function filter(key, value) {
    const u = new URL(page.url);
    u.searchParams.delete("page");
    if (value) u.searchParams.set(key, value);
    else u.searchParams.delete(key);
    goto(u.pathname + u.search, { keepFocus: true, noScroll: true });
  }
  function pagination(n) {
    const u = new URL(page.url);
    if (n === 1) u.searchParams.delete("page");
    else u.searchParams.set("page", n);
    return u.pathname + u.search;
  }
  const stats = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  };
  const relations = [
    ["Super effective against", "double_damage_to"],
    ["Not very effective against", "half_damage_to"],
    ["No effect against", "no_damage_to"],
    ["Weak to", "double_damage_from"],
    ["Resists", "half_damage_from"],
    ["Immune to", "no_damage_from"],
  ];
</script>

<svelte:head
  ><title>{data.kind === "home" ? "Pokédex" : data.title + " – Pokédex"}</title
  ></svelte:head
>
{#snippet badge(type)}<a
    class="badge"
    style={"--type:var(--type-" + type + ")"}
    href={"/types/" + type}>{human(type)}</a
  >{/snippet}
{#snippet evolution(node)}<li>
    <a href={"/pokemon/" + node.species.name}>{human(node.species.name)}</a
    >{#if node.evolves_to.length}<ul>
        {#each node.evolves_to as child (child.species.name)}{@render evolution(
            child,
          )}{/each}
      </ul>{/if}
  </li>{/snippet}
<header>
  <div class="header-inner">
    <a class="brand" href="/">Pokédex</a>
    <nav aria-label="Main">
      <a href="/">Pokémon</a><a href="/types">Types</a>
    </nav>
  </div>
</header>
<main>
  {#if data.kind === "pokemon"}
    <div class="summary">
      <img
        class="artwork"
        src={data.p.sprites.other["official-artwork"].front_default}
        alt={data.title}
      />
      <div>
        <span class="muted">{dex(data.s.id)}</span>
        <h1>{data.title}</h1>
        <p class="muted genus">
          {data.s.genera.find((g) => g.language.name === "en")?.genus}
        </p>
        <div class="badges">
          {#each data.p.types as t (t.slot)}{@render badge(t.type.name)}{/each}
        </div>
        <dl class="measurements">
          <div>
            <dt>Height</dt>
            <dd>{(data.p.height / 10).toFixed(1)} m</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{(data.p.weight / 10).toFixed(1)} kg</dd>
          </div>
        </dl>
        <p>{data.flavor}</p>
      </div>
    </div>
    <section aria-labelledby="stats">
      <h2 id="stats">Base stats</h2>
      <table class="stats">
        <tbody
          >{#each data.p.stats as s (s.stat.name)}<tr
              ><th scope="row">{stats[s.stat.name]}</th><td>{s.base_stat}</td
              ><td
                ><div class="track">
                  <div style:width={(s.base_stat / 255) * 100 + "%"}></div>
                </div></td
              ></tr
            >{/each}<tr
            ><th scope="row">Total</th><td
              >{data.p.stats.reduce((n, s) => n + s.base_stat, 0)}</td
            ><td
              ><div class="track">
                <div
                  style:width={(data.p.stats.reduce(
                    (n, s) => n + s.base_stat,
                    0,
                  ) /
                    1530) *
                    100 +
                    "%"}
                ></div>
              </div></td
            ></tr
          ></tbody
        >
      </table>
    </section>
    <section aria-labelledby="abilities">
      <h2 id="abilities">Abilities</h2>
      <ul>
        {#each data.p.abilities as a (a.slot)}<li>
            <a href={"/abilities/" + a.ability.name}>{human(a.ability.name)}</a
            >{a.is_hidden ? " (hidden)" : ""}
          </li>{/each}
      </ul>
    </section>
    <section aria-labelledby="evolution">
      <h2 id="evolution">Evolution</h2>
      <ul>{@render evolution(data.chain)}</ul>
    </section>
    <section id="moves" aria-labelledby="moves-heading">
      <h2 id="moves-heading">Moves</h2>
      <div class="game">
        <label for="game">Game</label>
        <select
          id="game"
          value={data.game}
          onchange={(e) => filter("game", e.currentTarget.value)}
          >{#each data.games as g (g.name)}<option value={g.name}
              >{g.label}</option
            >{/each}</select
        >
      </div>
      {#each data.tables as table (data.game + table.method)}<MoveTable
          {table}
        />{/each}
    </section>
  {:else}
    <h1>{data.title}</h1>
    {#if data.kind === "home"}
      <div class="filters">
        <label
          >Search<input
            type="search"
            value={page.url.searchParams.get("q") || ""}
            oninput={(e) => {
              const value = e.currentTarget.value;
              clearTimeout(timer);
              timer = setTimeout(() => filter("q", value), 150);
            }}
          /></label
        >
        <div>
          <label for="type">Type</label><select
            id="type"
            value={page.url.searchParams.get("type") || ""}
            onchange={(e) => filter("type", e.currentTarget.value)}
            ><option value="">All types</option
            >{#each data.types as t (t.name)}<option value={t.name}
                >{t.label}</option
              >{/each}</select
          >
        </div>
        <div>
          <label for="generation">Generation</label><select
            id="generation"
            value={page.url.searchParams.get("generation") || ""}
            onchange={(e) => filter("generation", e.currentTarget.value)}
            ><option value="">All generations</option
            >{#each data.gens as g (g.name)}<option value={g.name}
                >{g.label}</option
              >{/each}</select
          >
        </div>
      </div>
      <p class="count">{data.count} Pokémon</p>
      {#if data.count}<Cards items={data.cards} />{:else}<p>
          No Pokémon found
        </p>{/if}
      <div class="pagination">
        {#if data.page > 1}<a href={pagination(data.page - 1)}>Previous page</a
          >{/if}<span>Page {data.page} of {data.pages}</span
        >{#if data.page < data.pages}<a href={pagination(data.page + 1)}
            >Next page</a
          >{/if}
      </div>
    {:else if data.kind === "types"}<ul class="type-list">
        {#each data.types as t (t.name)}<li>{@render badge(t.name)}</li>{/each}
      </ul>
    {:else if data.kind === "moves" || data.kind === "abilities"}
      {#if data.kind === "moves"}<dl class="details">
          <div>
            <dt>Type</dt>
            <dd>{@render badge(data.r.type.name)}</dd>
          </div>
          {#each [["Category", human(data.r.damage_class.name)], ["Power", data.r.power], ["Accuracy", data.r.accuracy], ["PP", data.r.pp]] as pair (pair[0])}<div
            >
              <dt>{pair[0]}</dt>
              <dd>{pair[1] ?? "—"}</dd>
            </div>{/each}
        </dl>{/if}
      <section aria-labelledby="effect">
        <h2 id="effect">Effect</h2>
        <p>{data.effect}</p>
      </section>
      <section aria-labelledby="pokemon-list">
        <h2 id="pokemon-list">
          {data.kind === "moves" ? "Learned by" : "Pokémon"}
        </h2>
        <p class="count">{data.cards.length} Pokémon</p>
        <Cards items={data.cards} />
      </section>
    {:else if data.kind === "missing"}<p><a href="/">Back to Pokémon</a></p>
    {/if}
    {#if data.kind === "type"}
      <section aria-labelledby="relations">
        <h2 id="relations">Damage relations</h2>
        <dl class="relations">
          {#each relations as rel (rel[1])}<div>
              <dt>{rel[0]}</dt>
              <dd>
                {#each data.r.damage_relations[rel[1]] as t (t.name)}{@render badge(
                    t.name,
                  )}{:else}None{/each}
              </dd>
            </div>{/each}
        </dl>
      </section>
      <section aria-labelledby="type-pokemon">
        <h2 id="type-pokemon">Pokémon</h2>
        <p class="count">{data.cards.length} Pokémon</p>
        <Cards items={data.cards} />
      </section>
      <section aria-labelledby="type-moves">
        <h2 id="type-moves">Moves</h2>
        <p class="count">{data.r.moves.length} moves</p>
        <ul class="move-list">
          {#each [...data.r.moves].sort( (a, b) => human(a.name).localeCompare(human(b.name)) ) as m (m.name)}<li
            >
              <a href={"/moves/" + m.name}>{human(m.name)}</a>
            </li>{/each}
        </ul>
      </section>
    {/if}
  {/if}
</main>
<footer>
  Data from PokéAPI. Pokémon and Pokémon character names are trademarks of
  Nintendo.
</footer>
