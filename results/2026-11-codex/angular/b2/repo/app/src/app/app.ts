import { Component, signal } from '@angular/core';
import { Cards } from './cards/cards';
import { Evolution } from './evolution/evolution';
import { MoveTables } from './move-tables/move-tables';
import {
  api,
  list,
  human,
  english,
  idOf,
  flavor,
  Ref,
  Species,
  Pokemon,
  Type,
  Generation,
  Move,
  Ability,
  Chain,
  Card,
} from './data';
@Component({
  selector: 'app-page',
  imports: [Cards, Evolution, MoveTables],
  templateUrl: './app.html',
})
export class App {
  human = human;
  english = english;
  flavor = flavor;
  ready = signal(false);
  kind = '';
  heading = '';
  types: Type[] = [];
  generations: Generation[] = [];
  species: Ref[] = [];
  cards = signal<Card[]>([]);
  count = signal(0);
  page = signal(1);
  pages = signal(1);
  q = '';
  type = '';
  generation = '';
  pokemon!: Pokemon;
  detail!: Species;
  move!: Move;
  ability!: Ability;
  typeDetail!: Type;
  chain!: Chain;
  effect = '';
  statNames = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];
  total = 0;
  relations = [
    ['Super effective against', 'double_damage_to'],
    ['Not very effective against', 'half_damage_to'],
    ['No effect against', 'no_damage_to'],
    ['Weak to', 'double_damage_from'],
    ['Resists', 'half_damage_from'],
    ['Immune to', 'no_damage_from'],
  ];
  constructor() {
    this.load();
    window.addEventListener('popstate', () => this.load());
  }
  async load() {
    this.ready.set(false);
    try {
      const parts = location.pathname.split('/').filter(Boolean);
      const params = new URLSearchParams(location.search);
      this.species = await list('pokemon-species');
      if (!parts.length) {
        this.kind = 'home';
        this.heading = 'Pokémon';
        this.types = await Promise.all(
          (await list('type'))
            .filter((x) => !['stellar', 'unknown', 'shadow'].includes(x.name))
            .map((x) => api<Type>(x.url)),
        );
        this.generations = await Promise.all(
          (await list('generation')).map((x) => api<Generation>(x.url)),
        );
        this.q = params.get('q') || '';
        this.type = params.get('type') || '';
        this.generation = params.get('generation') || '';
        this.page.set(Number(params.get('page')) || 1);
        await this.filter();
      } else if (parts.length === 1 && parts[0] === 'types') {
        this.kind = 'types';
        this.heading = 'Types';
        this.types = await Promise.all(
          (await list('type'))
            .filter((x) => !['stellar', 'unknown', 'shadow'].includes(x.name))
            .map((x) => api<Type>(x.url)),
        );
      } else if (parts.length === 2) {
        const name = parts[1];
        this.kind = parts[0];
        if (this.kind === 'pokemon') {
          this.detail = await api<Species>('pokemon-species/' + name);
          this.pokemon = await api<Pokemon>('pokemon/' + this.detail.id);
          this.heading = english(this.detail);
          this.total = this.pokemon.stats.reduce((n, s) => n + s.base_stat, 0);
          this.chain = (await api<{ chain: Chain }>(this.detail.evolution_chain.url)).chain;
        } else if (this.kind === 'moves') {
          this.move = await api<Move>('move/' + name);
          this.heading = english(this.move);
          this.effect =
            this.move.effect_entries.find((x) => x.language.name === 'en')?.short_effect ||
            flavor(this.move);
          this.makeCards(this.move.learned_by_pokemon);
        } else if (this.kind === 'abilities') {
          this.ability = await api<Ability>('ability/' + name);
          this.heading = english(this.ability);
          this.effect =
            this.ability.effect_entries.find((x) => x.language.name === 'en')?.short_effect || '—';
          this.makeCards(
            this.ability.pokemon.map((x) => x.pokemon),
            new Set(this.ability.pokemon.filter((x) => x.is_hidden).map((x) => idOf(x.pokemon))),
          );
        } else if (this.kind === 'types') {
          this.typeDetail = await api<Type>('type/' + name);
          if (['stellar', 'unknown', 'shadow'].includes(name)) throw Error();
          this.heading = english(this.typeDetail);
          this.typeDetail.moves.sort((a, b) => human(a.name).localeCompare(human(b.name)));
          this.makeCards(this.typeDetail.pokemon.map((x) => x.pokemon));
        } else throw Error();
      } else throw Error();
    } catch {
      this.kind = 'missing';
      this.heading = 'Not found';
    }
    document.title = this.kind === 'home' ? 'Pokédex' : this.heading + ' – Pokédex';
    this.ready.set(true);
    if (location.hash)
      setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 100);
  }
  makeCards(refs: Ref[], hidden = new Set<number>()) {
    const lookup = new Map(this.species.map((x) => [idOf(x), x.name]));
    const base = new URL(this.species[0].url).origin;
    this.cards.set(
      refs
        .filter((r) => lookup.has(idOf(r)) && idOf(r) < 10000)
        .sort((a, b) => idOf(a) - idOf(b))
        .map((r) => ({
          id: idOf(r),
          name: lookup.get(idOf(r))!,
          hidden: hidden.has(idOf(r)),
          sprite: base + '/media/sprites/pokemon/' + idOf(r) + '.png',
        })),
    );
    this.count.set(this.cards().length);
  }
  private filterRun = 0;
  async filter() {
    const run = ++this.filterRun;
    let refs = this.species.filter((x) =>
      human(x.name).toLowerCase().includes(this.q.toLowerCase()),
    );
    if (this.generation) {
      const ids = new Set(
        this.generations.find((g) => g.name === this.generation)?.pokemon_species.map(idOf),
      );
      refs = refs.filter((x) => ids.has(idOf(x)));
    }
    if (this.type) {
      const t = this.types.find((x) => x.name === this.type);
      const ids = new Set(t?.pokemon.map((x) => idOf(x.pokemon)));
      refs = refs.filter((x) => ids.has(idOf(x)));
    }
    refs.sort((a, b) => idOf(a) - idOf(b));
    const count = refs.length;
    const pages = Math.max(1, Math.ceil(count / 48));
    const p = Math.min(Math.max(1, this.page()), pages);
    const mons = await Promise.all(
      refs.slice((p - 1) * 48, p * 48).map((r) => api<Pokemon>('pokemon/' + idOf(r))),
    );
    if (run !== this.filterRun) return;
    this.count.set(count);
    this.pages.set(pages);
    this.page.set(p);
    this.cards.set(
      mons.map((p, i) => ({
        id: p.id,
        name: refs[(this.page() - 1) * 48 + i].name,
        sprite: p.sprites.front_default,
        types: [...p.types].sort((a, b) => a.slot - b.slot).map((x) => x.type),
      })),
    );
  }
  change(key: string, value: string) {
    if (key === 'q') this.q = value;
    if (key === 'type') this.type = value;
    if (key === 'generation') this.generation = value;
    this.page.set(1);
    history.pushState(null, '', this.pageUrl(1));
    this.filter();
  }
  pageUrl(page: number) {
    const p = new URLSearchParams();
    if (this.q) p.set('q', this.q);
    if (this.type) p.set('type', this.type);
    if (this.generation) p.set('generation', this.generation);
    if (page > 1) p.set('page', String(page));
    return '/' + (p.size ? '?' + p : '');
  }
  paginate(event: Event, p: number) {
    event.preventDefault();
    this.page.set(p);
    history.pushState(null, '', this.pageUrl(p));
    this.filter();
    window.scrollTo(0, 0);
  }
  genus() {
    return this.detail.genera.find((x) => x.language.name === 'en')?.genus;
  }
}
