export interface Ref { name: string; url: string }
export interface Named { name: string; names: {name:string;language:Ref}[] }
export interface Flavor { flavor_text:string; language:Ref }
export interface Species extends Named { id:number; genera:{genus:string;language:Ref}[]; flavor_text_entries:Flavor[]; evolution_chain:{url:string} }
export interface Pokemon { id:number; name:string; species:Ref; height:number; weight:number; types:{slot:number;type:Ref}[]; abilities:{slot:number;ability:Ref;is_hidden:boolean}[]; stats:{base_stat:number;stat:Ref}[]; sprites:{front_default:string;other:{'official-artwork':{front_default:string}}}; moves:{move:Ref;version_group_details:{level_learned_at:number;move_learn_method:Ref;version_group:Ref}[]}[] }
export interface Move extends Named { type:Ref;damage_class:Ref;power:number|null;accuracy:number|null;pp:number|null;effect_entries:{short_effect:string;language:Ref}[];flavor_text_entries:Flavor[];learned_by_pokemon:Ref[] }
export interface Ability extends Named { effect_entries:{short_effect:string;language:Ref}[];pokemon:{is_hidden:boolean;pokemon:Ref}[] }
export interface Type extends Named { pokemon:{pokemon:Ref;slot:number}[];moves:Ref[];damage_relations:Record<string,Ref[]> }
export interface Generation extends Named { pokemon_species:Ref[] }
export interface Game {name:string;order:number}
export interface Chain {species:Ref;evolves_to:Chain[]}
export interface Card {id:number;name:string;types?:Ref[];hidden?:boolean;sprite:string}
export interface MoveRow {level:number;name:string;label:string;type:string;typeLabel:string;category:string;power:number|null;accuracy:number|null;pp:number|null}
export const human = (name:string) => name.split('-').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ');
export const english = (item:Named) => item.names.find(n=>n.language.name==='en')?.name || human(item.name);
export const idOf = (ref:Ref) => Number(ref.url.split('/').filter(Boolean).at(-1));
export const flavor = (item:{flavor_text_entries:Flavor[]}) => item.flavor_text_entries.filter(f=>f.language.name==='en').at(-1)?.flavor_text.replace(/\s+/g,' ').trim() || '—';
