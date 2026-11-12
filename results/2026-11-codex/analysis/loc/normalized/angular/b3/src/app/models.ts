export interface Ref {
  name: string;
  url: string;
}
export interface Localized {
  language: Ref;
  name: string;
}
export interface Chain {
  species: Ref;
  evolves_to: Chain[];
}
export interface Resource {
  id: number;
  name: string;
  names: Localized[];
  results: Ref[];
  order: number;
  sprites: {
    front_default: string;
    other: { "official-artwork": { front_default: string } };
  };
  types: { slot: number; type: Ref }[];
  species: Ref;
  height: number;
  weight: number;
  genera: { language: Ref; genus: string }[];
  flavor_text_entries: { language: Ref; flavor_text: string }[];
  stats: { base_stat: number; stat: Ref }[];
  abilities: { slot: number; is_hidden: boolean; ability: Ref }[];
  evolution_chain: { url: string };
  chain: Chain;
  moves: ({
    move: Ref;
    version_group_details: {
      level_learned_at: number;
      move_learn_method: Ref;
      version_group: Ref;
    }[];
  } & Ref)[];
  pokemon: { pokemon: Ref; is_hidden: boolean }[];
  pokemon_species: Ref[];
  type: Ref;
  damage_class: Ref;
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect_entries: { language: Ref; short_effect: string }[];
  learned_by_pokemon: Ref[];
  damage_relations: Record<string, Ref[]>;
}
export interface Card {
  id: number;
  name: string;
  image: string;
  types: Ref[];
  hidden?: boolean;
}
export interface MoveRow {
  level: number;
  name: string;
  apiName: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
}
export interface MoveTable {
  name: string;
  rows: MoveRow[];
  column?: string;
  direction?: "ascending" | "descending";
}
