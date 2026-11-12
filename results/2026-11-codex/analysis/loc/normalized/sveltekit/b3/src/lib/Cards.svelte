<script>
  import { human, dex } from "./utils.js";
  let { items } = $props();
</script>

<ul class="cards">
  {#each items as item (item.id)}<li>
      <a href={"/pokemon/" + item.name}
        ><img
          src={item.sprite}
          alt={human(item.name)}
          width="96"
          height="96"
        /><span class="dex">{dex(item.id)}</span><span>{human(item.name)}</span
        >{#if item.types}<span class="badges"
            >{#each item.types as type (type)}<span
                class="badge"
                style={"--type:var(--type-" + type + ")"}>{human(type)}</span
              >{/each}</span
          >{/if}{#if item.hidden}<span class="muted">Hidden ability</span
          >{/if}</a
      >
    </li>{/each}
</ul>
