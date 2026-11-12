export interface Ref {
  name: string;
  url: string;
}
export interface Named {
  name: string;
  names: { name: string; language: Ref }[];
}
export interface Species extends Named {
  id: number;
  genera: { genus: string; language: Ref }[];
  flavor_text_entries: Flavor[];
  evolution_chain: { url: string };
}
export interface Flavor {
  language: Ref;
  flavor_text: string;
}
export interface Pokemon {
  id: number;
  species: Ref;
  height: number;
  weight: number;
  sprites: { front_default: string; other: { 'official-artwork': { front_default: string } } };
  types: { slot: number; type: Ref }[];
  stats: { base_stat: number; stat: Ref }[];
  abilities: { slot: number; is_hidden: boolean; ability: Ref }[];
  moves: {
    move: Ref;
    version_group_details: {
      level_learned_at: number;
      move_learn_method: Ref;
      version_group: Ref;
    }[];
  }[];
}
export interface Move extends Named {
  type: Ref;
  damage_class: Ref;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effect_entries: { language: Ref; short_effect: string }[];
  flavor_text_entries: Flavor[];
  learned_by_pokemon: Ref[];
}
export interface Ability extends Named {
  effect_entries: { language: Ref; short_effect: string }[];
  pokemon: { is_hidden: boolean; pokemon: Ref }[];
}
export interface Type extends Named {
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
export interface Card {
  id: number;
  name: string;
  hidden?: boolean;
  types?: Ref[];
  sprite: string;
}
export const human = (s: string) =>
  s
    .split('-')
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
export const english = (r: Named) =>
  r.names.find((n) => n.language.name === 'en')?.name || human(r.name);
export const idOf = (r: Ref) => Number(r.url.match(/\/(\d+)\/?$/)?.[1]);
export const flavor = (r: { flavor_text_entries?: Flavor[] }) =>
  r.flavor_text_entries
    ?.filter((f) => f.language.name === 'en')
    .at(-1)
    ?.flavor_text.replace(/\s+/g, ' ') || '—';
const cache = new Map<string, Promise<unknown>>();
let basePromise: Promise<string>;
export function api<T>(path: string): Promise<T> {
  basePromise ??= fetch('/config.json')
    .then((r) => r.json())
    .then((c) => c.base);
  if (!cache.has(path))
    cache.set(
      path,
      basePromise
        .then((base) => fetch(path.startsWith('http') ? path : base + '/api/v2/' + path))
        .then((r) => {
          if (!r.ok) throw Error('Not found');
          return r.json();
        }),
    );
  return cache.get(path) as Promise<T>;
}
export const list = (resource: string) =>
  api<{ results: Ref[] }>(resource + '/?limit=100000').then((x) => x.results);
