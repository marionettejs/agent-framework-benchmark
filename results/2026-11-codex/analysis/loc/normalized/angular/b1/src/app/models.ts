export interface Ref {
  name: string;
  url: string;
}
export interface Named {
  id: number;
  name: string;
  names: { name: string; language: Ref }[];
}
export interface Flavor {
  flavor_text: string;
  language: Ref;
}
export interface Species extends Named {
  genera: { genus: string; language: Ref }[];
  flavor_text_entries: Flavor[];
  evolution_chain: { url: string };
  generation: Ref;
}
export interface Learn {
  level_learned_at: number;
  move_learn_method: Ref;
  version_group: Ref;
}
export interface PokemonData {
  id: number;
  name: string;
  species: Ref;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
    other: { "official-artwork": { front_default: string } };
  };
  types: { slot: number; type: Ref }[];
  abilities: { slot: number; is_hidden: boolean; ability: Ref }[];
  stats: { base_stat: number; stat: Ref }[];
  moves: { move: Ref; version_group_details: Learn[] }[];
}
export interface Effect {
  short_effect: string;
  language: Ref;
}
export interface Move extends Named {
  type: Ref;
  damage_class: Ref;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effect_entries: Effect[];
  flavor_text_entries: Flavor[];
  learned_by_pokemon: Ref[];
}
export interface Ability extends Named {
  effect_entries: Effect[];
  pokemon: { is_hidden: boolean; pokemon: Ref }[];
}
export interface TypeData extends Named {
  pokemon: { pokemon: Ref }[];
  moves: Ref[];
  damage_relations: Record<string, Ref[]>;
}
export interface Generation extends Named {
  pokemon_species: Ref[];
}
export interface Chain {
  species: Ref;
  evolves_to: Chain[];
}
export interface Game {
  name: string;
  order: number;
}
export interface Card {
  id: number;
  name: string;
  sprite: string;
  types?: Ref[];
  hidden?: boolean;
}
export const human = (s: string) =>
  s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
export const english = (s: Named) =>
  s.names.find((n) => n.language.name === "en")?.name ?? human(s.name);
export const idOf = (r: Ref) => Number(r.url.match(/\/(\d+)\/?$/)?.[1]);
export const dex = (id: number) => "#" + String(id).padStart(4, "0");
export const flavor = (s: { flavor_text_entries: Flavor[] }) =>
  s.flavor_text_entries
    .filter((f) => f.language.name === "en")
    .at(-1)
    ?.flavor_text.replace(/\s+/g, " ")
    .trim() ?? "—";
export const effectText = (s: { effect_entries: Effect[] }) =>
  s.effect_entries.find((e) => e.language.name === "en")?.short_effect;
