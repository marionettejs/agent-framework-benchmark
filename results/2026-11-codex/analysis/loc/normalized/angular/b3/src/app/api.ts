import { Injectable } from "@angular/core";
import { Resource, Ref, Card } from "./models";
export const human = (name: string) =>
  name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
export const english = (r: Resource) =>
  r.names?.find((n) => n.language.name === "en")?.name || human(r.name);
export const dex = (id: number) => "#" + String(id).padStart(4, "0");
export const idOf = (r: Ref) => Number(r.url.match(/\/(\d+)\/$/)?.[1]);
export const flavor = (r: Resource) =>
  r.flavor_text_entries
    ?.filter((e) => e.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ") || "—";
@Injectable({ providedIn: "root" })
export class Api {
  base = (window as unknown as { API_BASE_URL: string }).API_BASE_URL;
  private cache = new Map<string, Promise<Resource>>();
  get(path: string): Promise<Resource> {
    const url = path.startsWith("http") ? path : `${this.base}/api/v2/${path}`;
    let response = this.cache.get(url);
    if (!response) {
      response = fetch(url).then((r) => {
        if (!r.ok) throw Error("Not found");
        return r.json() as Promise<Resource>;
      });
      this.cache.set(url, response);
    }
    return response;
  }
  async cards(
    refs: { pokemon: Ref; is_hidden?: boolean }[] | Ref[],
    types = false,
  ): Promise<Card[]> {
    const list = refs
      .map((r) =>
        "pokemon" in r
          ? { ref: r.pokemon, hidden: r.is_hidden }
          : { ref: r, hidden: false },
      )
      .filter((r) => idOf(r.ref) < 10000)
      .sort((a, b) => idOf(a.ref) - idOf(b.ref));
    return Promise.all(
      list.map(async ({ ref, hidden }) => {
        const p = await this.get(`pokemon/${idOf(ref)}/`);
        return {
          id: p.id,
          name: p.species.name,
          image: p.sprites.front_default,
          types: types ? p.types.map((t) => t.type) : [],
          hidden,
        };
      }),
    );
  }
}
