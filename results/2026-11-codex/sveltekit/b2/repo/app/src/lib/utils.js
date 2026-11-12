export const human = (s = "") =>
  s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
export const english = (r) =>
  r.names?.find((x) => x.language.name === "en")?.name ?? human(r.name);
export const flavor = (r) =>
  r.flavor_text_entries
    ?.filter((x) => x.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ") ?? "—";
export const idOf = (r) => Number(r.url.match(/\/(\d+)\/$/)[1]);
