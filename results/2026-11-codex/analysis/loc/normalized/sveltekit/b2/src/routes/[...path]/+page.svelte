<script>
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Cards from "#lib/Cards.svelte";
  import MoveTable from "#lib/MoveTable.svelte";
  import { human } from "#lib/utils";
  import "#lib/style.css";
  let { data } = $props();
  let timer;
  function update(key, value) {
    const u = new URL(window.location.href);
    value ? u.searchParams.set(key, value) : u.searchParams.delete(key);
    if (key !== "game") u.searchParams.delete("page");
    goto(u.pathname + u.search + u.hash, { keepFocus: true, noScroll: true });
  }
  function pagination(n) {
    const u = new URL(page.url);
    n === 1 ? u.searchParams.delete("page") : u.searchParams.set("page", n);
    return u.pathname + u.search;
  }
  const stats = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
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
{#snippet typeLink(t)}<a
    class="badge"
    style:background={"var(--type-" + t + ")"}
    href={"/types/" + t}>{data.types[t] || human(t)}</a
  >{/snippet}
{#snippet evolution(node)}<li>
    <a href={"/pokemon/" + node.species.name}>{human(node.species.name)}</a
    >{#if node.evolves_to.length}<ul>
        {#each node.evolves_to as child (child.species.name)}{@render evolution(
            child,
          )}{/each}
      </ul>{/if}
  </li>{/snippet}
{#snippet cardSection(title, items)}<section
    aria-labelledby={"section-" + title.replaceAll(" ", "-")}
  >
    <h2 id={"section-" + title.replaceAll(" ", "-")}>{title}</h2>
    <p class="count">{items.length} Pokémon</p>
    <Cards {items} />
  </section>{/snippet}
<header>
  <div class="header-inner">
    <a class="brand" href="/">Pokédex</a>
    <nav><a href="/">Pokémon</a><a href="/types">Types</a></nav>
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
        <p class="dex">#{String(data.s.id).padStart(4, "0")}</p>
        <h1>{data.title}</h1>
        <p class="muted">
          {data.s.genera.find((g) => g.language.name === "en")?.genus}
        </p>
        <div class="badges">
          {#each data.p.types as t (t.slot)}{@render typeLink(
              t.type.name,
            )}{/each}
        </div>
        <dl class="measure">
          <div>
            <dt>Height</dt>
            <dd>{(data.p.height / 10).toFixed(1)} m</dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{(data.p.weight / 10).toFixed(1)} kg</dd>
          </div>
        </dl>
        <p>{data.description}</p>
      </div>
    </div>
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading">Base stats</h2>
      <table class="stats">
        <tbody
          >{#each data.p.stats as s, i (s.stat.name)}<tr
              ><th scope="row">{stats[i]}</th><td>{s.base_stat}</td><td
                ><div class="track">
                  <div
                    style:width={Math.min(100, (s.base_stat / 255) * 100) + "%"}
                  ></div>
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
                    720) *
                    100 +
                    "%"}
                ></div>
              </div></td
            ></tr
          ></tbody
        >
      </table>
    </section>
    <section aria-labelledby="abilities-heading">
      <h2 id="abilities-heading">Abilities</h2>
      <ul>
        {#each data.p.abilities as a (a.slot)}<li>
            <a href={"/abilities/" + a.ability.name}>{human(a.ability.name)}</a
            >{a.is_hidden ? " (hidden)" : ""}
          </li>{/each}
      </ul>
    </section>
    <section aria-labelledby="evolution-heading">
      <h2 id="evolution-heading">Evolution</h2>
      <ul class="evolution">{@render evolution(data.chain)}</ul>
    </section>
    <section id="moves" aria-labelledby="moves-heading">
      <h2 id="moves-heading">Moves</h2>
      <label class="game"
        >Game <select
          aria-label="Game"
          value={data.game}
          onchange={(e) => update("game", e.currentTarget.value)}
          >{#each data.games as game (game)}<option value={game}
              >{human(game)}</option
            >{/each}</select
        ></label
      >{#each data.methods as method (data.game + method.name)}<MoveTable
          {method}
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
              clearTimeout(timer);
              const value = e.currentTarget.value;
              timer = setTimeout(() => update("q", value), 150);
            }}
          /></label
        ><label
          >Type<select
            aria-label="Type"
            value={page.url.searchParams.get("type") || ""}
            onchange={(e) => update("type", e.currentTarget.value)}
            ><option value="">All types</option
            >{#each Object.entries(data.types) as [name, label] (name)}<option
                value={name}>{label}</option
              >{/each}</select
          ></label
        ><label
          >Generation<select
            aria-label="Generation"
            value={page.url.searchParams.get("generation") || ""}
            onchange={(e) => update("generation", e.currentTarget.value)}
            ><option value="">All generations</option
            >{#each data.generations as g (g.name)}<option value={g.name}
                >{g.label}</option
              >{/each}</select
          ></label
        >
      </div>
      <p class="count">{data.count} Pokémon</p>
      {#if data.count}<Cards items={data.items} types={data.types} />{:else}<p>
          No Pokémon found
        </p>{/if}
      <div class="pagination">
        {#if data.page > 1}<a href={pagination(data.page - 1)}>Previous page</a
          >{/if}<span>Page {data.page} of {data.total}</span
        >{#if data.page < data.total}<a href={pagination(data.page + 1)}
            >Next page</a
          >{/if}
      </div>
    {:else if data.kind === "types"}<ul class="type-grid">
        {#each Object.keys(data.types) as t (t)}<li>
            {@render typeLink(t)}
          </li>{/each}
      </ul>
    {:else if data.kind === "moves" || data.kind === "abilities"}
      {#if data.kind === "moves"}<dl class="details">
          <div>
            <dt>Type</dt>
            <dd>{@render typeLink(data.r.type.name)}</dd>
          </div>
          {#each [["Category", human(data.r.damage_class.name)], ["Power", data.r.power], ["Accuracy", data.r.accuracy], ["PP", data.r.pp]] as [label, value] (label)}<div
            >
              <dt>{label}</dt>
              <dd>{value ?? "—"}</dd>
            </div>{/each}
        </dl>{/if}
      <section aria-labelledby="effect-heading">
        <h2 id="effect-heading">Effect</h2>
        <p>{data.effect}</p>
      </section>
      {@render cardSection(
        data.kind === "moves" ? "Learned by" : "Pokémon",
        data.items,
      )}
    {:else if data.kind === "type"}<section aria-labelledby="relations-heading">
        <h2 id="relations-heading">Damage relations</h2>
        <dl class="relations">
          {#each relations as [label, key] (key)}<dt>{label}</dt>
            <dd>
              {#each data.r.damage_relations[key] as t (t.name)}{@render typeLink(
                  t.name,
                )}{:else}None{/each}
            </dd>{/each}
        </dl>
      </section>
      {@render cardSection("Pokémon", data.items)}
      <section aria-labelledby="type-moves">
        <h2 id="type-moves">Moves</h2>
        <p class="count">{data.r.moves.length} moves</p>
        <ul class="move-list">
          {#each [...data.r.moves].sort( (a, b) => a.name.localeCompare(b.name) ) as m (m.name)}<li
            >
              <a href={"/moves/" + m.name}>{human(m.name)}</a>
            </li>{/each}
        </ul>
      </section>
    {:else}<p><a href="/">Back to Pokémon</a></p>{/if}{/if}
</main>
<footer>
  Data from PokéAPI. Pokémon and Pokémon character names are trademarks of
  Nintendo.
</footer>
