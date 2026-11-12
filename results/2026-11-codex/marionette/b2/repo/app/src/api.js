const { api } = await fetch("/config.json").then((r) => r.json());
export const base = api;
const cache = new Map();
export function get(resource) {
  const url = resource.startsWith("http")
    ? resource
    : `${api}/api/v2/${resource}`;
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .catch((e) => {
          cache.delete(url);
          throw e;
        }),
    );
  return cache.get(url);
}
export const id = (r) => Number(r.url.match(/\/(\d+)\/?$/)?.[1]);
export const human = (s) =>
  s
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
export const english = (r) =>
  r.names?.find((n) => n.language.name === "en")?.name || human(r.name);
export const flavor = (r) =>
  r.flavor_text_entries
    ?.filter((x) => x.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ") || "—";
export const effect = (r) =>
  r.effect_entries?.find((x) => x.language.name === "en")?.short_effect ||
  flavor(r);
export const species = () =>
  get("pokemon-species/?limit=10000").then((r) => r.results);
export const types = () =>
  get("type/?limit=100").then((r) =>
    Promise.all(
      r.results
        .filter((x) => !["stellar", "unknown", "shadow"].includes(x.name))
        .map((x) => get(x.url)),
    ),
  );
