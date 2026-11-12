<script>
  import { human } from "./utils";
  let { method } = $props();
  let column = $state("");
  let descending = $state(false);
  let columns = $derived([
    ...(method.name === "level-up" ? ["Level"] : []),
    "Move",
    "Type",
    "Category",
    "Power",
    "Accuracy",
    "PP",
  ]);
  let rows = $derived.by(() => {
    if (!column) return method.rows;
    const key = column === "Level" ? "level" : column;
    return [...method.rows].sort((a, b) => {
      if (a[key] == null) return b[key] == null ? 0 : 1;
      if (b[key] == null) return -1;
      const diff =
        typeof a[key] === "number"
          ? a[key] - b[key]
          : a[key].localeCompare(b[key]);
      return descending ? -diff : diff;
    });
  });
  function sort(c) {
    if (column === c) descending = !descending;
    else {
      column = c;
      descending = false;
    }
  }
</script>

<div class="table-scroll">
  <table>
    <caption>{human(method.name)}</caption><thead
      ><tr
        >{#each columns as c (c)}<th
            aria-sort={column === c
              ? descending
                ? "descending"
                : "ascending"
              : undefined}><button onclick={() => sort(c)}>{c}</button></th
          >{/each}</tr
      ></thead
    ><tbody
      >{#each rows as r (r.name + "-" + r.level)}<tr
          >{#if method.name === "level-up"}<td>{r.level}</td>{/if}<td
            ><a href={"/moves/" + r.name}>{r.Move}</a></td
          ><td
            ><a
              class="badge"
              style:background={"var(--type-" + r.type + ")"}
              href={"/types/" + r.type}>{r.Type}</a
            ></td
          ><td>{r.Category}</td><td>{r.Power ?? "—"}</td><td
            >{r.Accuracy ?? "—"}</td
          ><td>{r.PP ?? "—"}</td></tr
        >{/each}</tbody
    >
  </table>
</div>
