<script>
  import { human } from "./utils";
  let { items, types = {} } = $props();
</script>

<ul class="cards">
  {#each items as c (c.id)}<li>
      <a href={"/pokemon/" + c.name}
        ><img src={c.sprite} alt={human(c.name)} width="96" height="96" /><span
          class="dex">#{String(c.id).padStart(4, "0")}</span
        ><span>{human(c.name)}</span>{#if c.types}<span class="badges"
            >{#each c.types as t (t)}<span
                class="badge"
                style:background={"var(--type-" + t + ")"}
                >{types[t] || human(t)}</span
              >{/each}</span
          >{/if}{#if c.hidden}<small>Hidden ability</small>{/if}</a
      >
    </li>{/each}
</ul>
