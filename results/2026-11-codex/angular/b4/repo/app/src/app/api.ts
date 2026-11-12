import { Injectable } from '@angular/core';
import { Ref, Species, Pokemon, Card, idOf } from './models';
@Injectable({providedIn:'root'})
export class Api {
  private config = fetch('/config.json').then(r=>r.json()) as Promise<{api:string}>;
  private cache = new Map<string,Promise<unknown>>();
  async get<T>(resource:string):Promise<T> {
    const {api} = await this.config;
    const url = resource.startsWith('http') ? resource : `${api}/api/v2/${resource}`;
    if (!this.cache.has(url)) this.cache.set(url, fetch(url).then(r=>{if(!r.ok) throw new Error('Not found');return r.json();}));
    return this.cache.get(url) as Promise<T>;
  }
  async list(resource:string) { return (await this.get<{results:Ref[]}>(`${resource}/?limit=100000`)).results; }
  async cards(refs: {pokemon:Ref;is_hidden?:boolean}[], types=false):Promise<Card[]> {
    const species = await this.list('pokemon-species');
    const byId = new Map(species.map(s=>[idOf(s),s.name]));
    const selected = refs.filter(r=>byId.has(idOf(r.pokemon))).sort((a,b)=>idOf(a.pokemon)-idOf(b.pokemon));
    const {api} = await this.config;
    return Promise.all(selected.map(async r=> {
      const id=idOf(r.pokemon); const p=types ? await this.get<Pokemon>(`pokemon/${id}/`) : null;
      return {id,name:byId.get(id)!,hidden:r.is_hidden,sprite:p?.sprites.front_default || `${api}/media/sprites/pokemon/${id}.png`,types:p?.types.sort((a,b)=>a.slot-b.slot).map(t=>t.type)};
    }));
  }
}
