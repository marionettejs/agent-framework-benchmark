const config = await fetch("/config.json").then((r) => r.json());
export const origin = config.api.replace(/\/$/, "");
const cache = new Map();
export function get(resource) {
  const url = resource.startsWith("http")
    ? resource
    : `${origin}/api/v2/${resource}`;
  if (!cache.has(url)) {
    const request = fetch(url).then((r) => {
      if (!r.ok) {
        const e = new Error("API request failed");
        e.status = r.status;
        throw e;
      }
      return r.json();
    });
    cache.set(url, request);
    request.catch(() => {
      if (cache.get(url) === request) cache.delete(url);
    });
  }
  return cache.get(url);
}
export const idOf = (ref) => Number(ref.url.match(/\/(\d+)\/?$/)?.[1]);
export const human = (name) =>
  name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
export const english = (data) =>
  data.names?.find((n) => n.language.name === "en")?.name || human(data.name);
export const flavor = (data) =>
  (
    data.flavor_text_entries?.filter((n) => n.language.name === "en").at(-1)
      ?.flavor_text || "—"
  ).replace(/\s+/g, " ");
export const effect = (data) =>
  data.effect_entries?.find((n) => n.language.name === "en")?.short_effect ||
  flavor(data);
export async function all(resource) {
  const first = await get(`${resource}/?limit=10000`);
  let results = first.results;
  let next = first.next;
  while (next) {
    const p = await get(next);
    results = results.concat(p.results);
    next = p.next;
  }
  return results;
}
let catalogPromise;
export function catalog() {
  return (catalogPromise ||= all("pokemon-species").then((refs) =>
    refs.map((r) => ({ ...r, id: idOf(r) })).sort((a, b) => a.id - b.id),
  ));
}
export async function cardRecords(entries) {
  const species = await catalog();
  const byId = new Map(species.map((s) => [s.id, s]));
  return entries
    .map((e) => {
      const ref = e.pokemon || e;
      return { ...byId.get(idOf(ref)), hidden: e.is_hidden };
    })
    .filter((e) => e.id)
    .sort((a, b) => a.id - b.id);
}
export async function typeResources() {
  return Promise.all(
    (await all("type"))
      .filter((t) => !["stellar", "unknown", "shadow"].includes(t.name))
      .map((t) => get(t.url)),
  );
}
