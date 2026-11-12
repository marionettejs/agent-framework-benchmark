import { Injectable } from "@angular/core";
import {
  Card,
  Ref,
  Named,
  PokemonData,
  TypeData,
  Generation,
  idOf,
} from "./models";

declare global {
  interface Window {
    POKE_API: string;
  }
}
@Injectable({ providedIn: "root" })
export class Api {
  readonly base = window.POKE_API || "http://localhost:9000";
  private cache = new Map<string, Promise<unknown>>();
  get<T>(path: string): Promise<T> {
    const url = path.startsWith("http") ? path : this.base + "/api/v2/" + path;
    if (!this.cache.has(url))
      this.cache.set(
        url,
        fetch(url).then((r) => {
          if (!r.ok) throw new Error("Resource unavailable");
          return r.json();
        }),
      );
    return this.cache.get(url) as Promise<T>;
  }
  async list(resource: string) {
    return (await this.get<{ results: Ref[] }>(resource + "/?limit=100000"))
      .results;
  }
  async types() {
    const refs = (await this.list("type")).filter(
      (r) => !["stellar", "unknown", "shadow"].includes(r.name),
    );
    return Promise.all(refs.map((r) => this.get<TypeData>(r.url)));
  }
  async generations() {
    return Promise.all(
      (await this.list("generation"))
        .slice(0, 9)
        .map((r) => this.get<Generation>(r.url)),
    );
  }
  async cards(refs: { pokemon: Ref; is_hidden?: boolean }[]): Promise<Card[]> {
    const species = await this.list("pokemon-species");
    const names = new Map(species.map((s) => [idOf(s), s.name]));
    return refs
      .filter((r) => names.has(idOf(r.pokemon)))
      .map((r) => ({
        id: idOf(r.pokemon),
        name: names.get(idOf(r.pokemon))!,
        sprite:
          this.base + "/media/sprites/pokemon/" + idOf(r.pokemon) + ".png",
        hidden: r.is_hidden,
      }))
      .sort((a, b) => a.id - b.id);
  }
  async homeCards(refs: Ref[]): Promise<Card[]> {
    return Promise.all(
      refs.map(async (r) => {
        const id = idOf(r);
        const p = await this.get<PokemonData>("pokemon/" + id + "/");
        return {
          id,
          name: r.name,
          sprite: p.sprites.front_default,
          types: p.types
            .slice()
            .sort((a, b) => a.slot - b.slot)
            .map((t) => t.type),
        };
      }),
    );
  }
}
