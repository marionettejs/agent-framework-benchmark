<script>
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Cards from "#lib/Cards.svelte";
  import MoveTable from "#lib/MoveTable.svelte";
  import "#lib/tokens.css";
  import "#lib/style.css";
  let { data } = $props();
  const human = (s) =>
    s
      .split("-")
      .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
      .join(" ");
  const english = (r) =>
    r.names?.find((x) => x.language.name === "en")?.name || human(r.name);
  function update(key, value) {
    const u = new URL(page.url);
    value ? u.searchParams.set(key, value) : u.searchParams.delete(key);
    if (key !== "game") u.searchParams.delete("page");
    goto(u.pathname + u.search + u.hash, { keepFocus: true, noScroll: true });
  }
  let timer;
  let methods = $derived(
    data.moves
      ? [
          ...new Set(
            data.moves.flatMap((m) =>
              m.details.map((d) => d.move_learn_method.name),
            ),
          ),
        ].sort((a, b) => {
          const order = ["level-up", "machine", "egg", "tutor"];
          return (
            (order.includes(a) ? order.indexOf(a) : 4) -
              (order.includes(b) ? order.indexOf(b) : 4) || a.localeCompare(b)
          );
        })
      : [],
  );
  function rows(method) {
    return data.moves.flatMap((m) =>
      m.details
        .filter((d) => d.move_learn_method.name === method)
        .map((d) => ({
          id: m.data.id,
          slug: m.data.name,
          name: english(m.data),
          type: m.data.type.name,
          category: human(m.data.damage_class.name),
          power: m.data.power,
          accuracy: m.data.accuracy,
          pp: m.data.pp,
          level: d.level_learned_at,
        })),
    );
  }
  function pagination(n) {
    const u = new URL(page.url);
    n === 1 ? u.searchParams.delete("page") : u.searchParams.set("page", n);
    return u.pathname + u.search;
  }
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
<header>
  <div>
    <a class="brand" href="/">Pokédex</a>
    <nav><a href="/">Pokémon</a><a href="/types">Types</a></nav>
  </div>
</header>
<main>
  {#snippet badge(t)}<a
      class="badge"
      style:background={`var(--type-${t})`}
      href={"/types/" + t}
      >{data.types?.find((x) => x.name === t)?.label || human(t)}</a
    >{/snippet}
  {#snippet chain(node)}<li>
      <a href={"/pokemon/" + node.species.name}>{human(node.species.name)}</a
      >{#if node.evolves_to.length}<ul>
          {#each node.evolves_to as next (next.species.name)}{@render chain(
              next,
            )}{/each}
        </ul>{/if}
    </li>{/snippet}
  {#if data.kind === "pokemon"}
    <div class="summary">
      <img
        class="artwork"
        src={data.p.sprites.other["official-artwork"].front_default}
        alt={data.title}
      />
      <div>
        <span class="number">#{String(data.species.id).padStart(4, "0")}</span>
        <h1>{data.title}</h1>
        <p class="genus">
          {data.species.genera.find((g) => g.language.name === "en")?.genus}
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
    <section aria-labelledby="stats-heading">
      <h2 id="stats-heading">Base stats</h2>
      <table class="stats">
        <tbody
          >{#each data.p.stats as s, i (s.stat.name)}<tr
              ><th scope="row"
                >{["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"][
                  i
                ]}</th
              ><td>{s.base_stat}</td><td
                ><div class="track">
                  <div style:width={`${(s.base_stat / 255) * 100}%`}></div>
                </div></td
              ></tr
            >{/each}<tr
            ><th scope="row">Total</th><td
              >{data.p.stats.reduce((s, x) => s + x.base_stat, 0)}</td
            ><td
              ><div class="track">
                <div
                  style:width={`${(data.p.stats.reduce((s, x) => s + x.base_stat, 0) / 1530) * 100}%`}
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
      <ul>{@render chain(data.chain)}</ul>
    </section>
    <section id="moves" aria-labelledby="moves-heading">
      <h2 id="moves-heading">Moves</h2>
      <label class="game"
        >Game <select
          aria-label="Game"
          value={data.game}
          onchange={(e) => update("game", e.currentTarget.value)}
          >{#each data.versions as v (v.name)}<option value={v.name}
              >{human(v.name)}</option
            >{/each}</select
        ></label
      >{#each methods as method (method)}<MoveTable
          {method}
          rows={rows(method)}
        />{/each}
    </section>
  {:else}
    <h1>{data.title}</h1>
    {#if data.kind === "home"}
      <div class="filters">
        <label
          >Search<input
            type="search"
            value={data.q}
            oninput={(e) => {
              const v = e.currentTarget.value;
              clearTimeout(timer);
              timer = setTimeout(() => update("q", v), 180);
            }}
          /></label
        ><label
          >Type<select
            aria-label="Type"
            value={data.type}
            onchange={(e) => update("type", e.currentTarget.value)}
            ><option value="">All types</option
            >{#each data.types as t (t.name)}<option value={t.name}
                >{t.label}</option
              >{/each}</select
          ></label
        ><label
          >Generation<select
            aria-label="Generation"
            value={data.generation}
            onchange={(e) => update("generation", e.currentTarget.value)}
            ><option value="">All generations</option
            >{#each data.gens as g (g.name)}<option value={g.name}
                >{g.label}</option
              >{/each}</select
          ></label
        >
      </div>
      <p class="count">{data.count} Pokémon</p>
      {#if data.count}<Cards
          entries={data.entries}
          media={data.media}
        />{:else}<p>No Pokémon found</p>{/if}
      <div class="pagination">
        {#if data.page > 1}<a href={pagination(data.page - 1)}>Previous page</a
          >{/if}<span>Page {data.page} of {data.total}</span
        >{#if data.page < data.total}<a href={pagination(data.page + 1)}
            >Next page</a
          >{/if}
      </div>
    {:else if data.kind === "types"}<ul class="type-list">
        {#each data.types as t (t.name)}<li>{@render badge(t.name)}</li>{/each}
      </ul>
    {:else if data.kind === "moves" || data.kind === "abilities"}
      {#if data.kind === "moves"}<dl class="details">
          {#each ["Type", "Category", "Power", "Accuracy", "PP"] as term (term)}<div
            >
              <dt>{term}</dt>
              <dd>
                {#if term === "Type"}{@render badge(
                    data.r.type.name,
                  )}{:else if term === "Category"}{human(
                    data.r.damage_class.name,
                  )}{:else}{data.r[term.toLowerCase()] ?? "—"}{/if}
              </dd>
            </div>{/each}
        </dl>{/if}
      <section aria-labelledby="effect-heading">
        <h2 id="effect-heading">Effect</h2>
        <p>{data.effect}</p>
      </section>
      <section aria-labelledby="pokemon-heading">
        <h2 id="pokemon-heading">
          {data.kind === "moves" ? "Learned by" : "Pokémon"}
        </h2>
        <p class="count">{data.entries.length} Pokémon</p>
        <Cards entries={data.entries} media={data.media} />
      </section>
    {:else if data.kind === "type"}
      <section aria-labelledby="relations-heading">
        <h2 id="relations-heading">Damage relations</h2>
        <dl class="relations">
          {#each relations as [label, key] (key)}<dt>{label}</dt>
            <dd>
              {#if data.r.damage_relations[key].length}{#each data.r.damage_relations[key] as t (t.name)}{@render badge(
                    t.name,
                  )}
                {/each}{:else}None{/if}
            </dd>{/each}
        </dl>
      </section>
      <section aria-labelledby="pokemon-heading">
        <h2 id="pokemon-heading">Pokémon</h2>
        <p class="count">{data.entries.length} Pokémon</p>
        <Cards entries={data.entries} media={data.media} />
      </section>
      <section aria-labelledby="moves-heading">
        <h2 id="moves-heading">Moves</h2>
        <p class="count">{data.r.moves.length} moves</p>
        <ul class="move-list">
          {#each [...data.r.moves].sort( (a, b) => human(a.name).localeCompare(human(b.name)) ) as m (m.name)}<li
            >
              <a href={"/moves/" + m.name}>{human(m.name)}</a>
            </li>{/each}
        </ul>
      </section>
    {:else}<p><a href="/">Back to Pokémon</a></p>{/if}
  {/if}
</main>
<footer>
  Data from PokéAPI. Pokémon and Pokémon character names are trademarks of
  Nintendo.
</footer>
