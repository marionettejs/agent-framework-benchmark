import { Component, inject, signal, computed, afterRenderEffect } from '@angular/core';
import { Api, human, english, dex, flavor, idOf } from './api';
import { Resource, Ref, Card, MoveRow, MoveTable } from './models';
import { Cards } from './cards';
import { Evolution } from './evolution';
@Component({ selector: 'app-root', imports: [Cards, Evolution], templateUrl: './app.html' })
export class App {
  api = inject(Api);
  human = human;
  english = english;
  dex = dex;
  flavor = flavor;
  ready = signal(false);
  kind = signal('');
  heading = signal('');
  resource = signal<Resource | null>(null);
  pokemon = signal<Resource | null>(null);
  chain = signal<Resource['chain'] | null>(null);
  types = signal<Resource[]>([]);
  generations = signal<Resource[]>([]);
  species = signal<Ref[]>([]);
  cardList = signal<Card[]>([]);
  game = signal('');
  games = signal<Resource[]>([]);
  tables = signal<MoveTable[]>([]);
  query = signal(new URLSearchParams(location.search));
  q = computed(() => this.query().get('q') || '');
  type = computed(() => this.query().get('type') || '');
  generation = computed(() => this.query().get('generation') || '');
  page = computed(() => Math.max(1, Number(this.query().get('page') || 1)));
  total = signal(0);
  pages = computed(() => Math.max(1, Math.ceil(this.total() / 48)));
  stats = ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'];
  relations = [
    ['Super effective against', 'double_damage_to'],
    ['Not very effective against', 'half_damage_to'],
    ['No effect against', 'no_damage_to'],
    ['Weak to', 'double_damage_from'],
    ['Resists', 'half_damage_from'],
    ['Immune to', 'no_damage_from'],
  ];
  private sequence = 0;
  constructor() {
    afterRenderEffect(() => {
      if (this.ready() && location.hash)
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
    });
    this.load();
    window.addEventListener('popstate', () => {
      this.query.set(new URLSearchParams(location.search));
      if (this.kind() === 'home') this.filter();
      else this.load();
    });
  }
  async load() {
    this.ready.set(false);
    try {
      const parts = location.pathname.split('/').filter(Boolean);
      let title = '';
      if (!parts.length) {
        this.kind.set('home');
        title = 'Pokémon';
        const [species, types, gens] = await Promise.all([
          this.api.get('pokemon-species/?limit=10000'),
          this.api.get('type/?limit=100'),
          this.api.get('generation/?limit=100'),
        ]);
        this.species.set(species.results.sort((a, b) => idOf(a) - idOf(b)));
        this.types.set(
          await Promise.all(
            types.results
              .filter((t) => !['stellar', 'unknown', 'shadow'].includes(t.name))
              .map((t) => this.api.get(t.url)),
          ),
        );
        this.generations.set(await Promise.all(gens.results.map((g) => this.api.get(g.url))));
        await this.filter();
      } else if (parts[0] === 'types' && parts.length === 1) {
        this.kind.set('types');
        title = 'Types';
        const list = await this.api.get('type/?limit=100');
        this.types.set(
          await Promise.all(
            list.results
              .filter((t) => !['stellar', 'unknown', 'shadow'].includes(t.name))
              .map((t) => this.api.get(t.url)),
          ),
        );
      } else if (
        parts.length === 2 &&
        ['pokemon', 'moves', 'abilities', 'types'].includes(parts[0])
      ) {
        const endpoint = {
          pokemon: 'pokemon-species',
          moves: 'move',
          abilities: 'ability',
          types: 'type',
        }[parts[0]];
        const r = await this.api.get(`${endpoint}/${parts[1]}/`);
        this.resource.set(r);
        title = english(r);
        this.kind.set(parts[0] === 'types' ? 'type' : parts[0]);
        if (parts[0] === 'pokemon') {
          const p = await this.api.get(`pokemon/${r.id}/`);
          this.pokemon.set(p);
          this.chain.set((await this.api.get(r.evolution_chain.url)).chain);
          const versions = new Map<string, Ref>();
          for (const m of p.moves)
            for (const d of m.version_group_details)
              versions.set(d.version_group.name, d.version_group);
          this.games.set(
            (await Promise.all([...versions.values()].map((v) => this.api.get(v.url)))).sort(
              (a, b) => a.order - b.order,
            ),
          );
          const requested = this.query().get('game');
          this.game.set(
            this.games().find((g) => g.name === requested)?.name || this.games().at(-1)?.name || '',
          );
          await this.loadMoves();
        } else if (parts[0] === 'moves') {
          this.cardList.set(await this.api.cards(r.learned_by_pokemon));
        } else {
          this.cardList.set(await this.api.cards(r.pokemon));
        }
      } else throw Error('Not found');
      this.heading.set(title);
      document.title = this.kind() === 'home' ? 'Pokédex' : `${title} – Pokédex`;
    } catch {
      this.kind.set('not-found');
      this.heading.set('Not found');
      document.title = 'Not found – Pokédex';
    }
    this.ready.set(true);
  }
  async filter() {
    const seq = ++this.sequence;
    let list = this.species();
    const q = this.q().toLowerCase();
    if (q) list = list.filter((r) => human(r.name).toLowerCase().includes(q));
    if (this.type()) {
      const t = await this.api.get(`type/${this.type()}/`);
      const ids = new Set(t.pokemon.map((r) => idOf(r.pokemon)));
      list = list.filter((r) => ids.has(idOf(r)));
    }
    if (this.generation()) {
      const g = await this.api.get(`generation/${this.generation()}/`);
      const ids = new Set(g.pokemon_species.map(idOf));
      list = list.filter((r) => ids.has(idOf(r)));
    }
    const cards = await this.api.cards(list.slice((this.page() - 1) * 48, this.page() * 48), true);
    if (seq !== this.sequence) return;
    this.total.set(list.length);
    this.cardList.set(cards);
  }
  changeFilter(key: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const params = new URLSearchParams(this.query());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    this.query.set(params);
    history.replaceState({}, '', this.url(params));
    this.filter();
  }
  url(params: URLSearchParams) {
    return location.pathname + (params.size ? '?' + params : '') + location.hash;
  }
  pageUrl(n: number) {
    const params = new URLSearchParams(this.query());
    if (n === 1) params.delete('page');
    else params.set('page', String(n));
    return this.url(params);
  }
  effect(r: Resource) {
    return r.effect_entries?.find((e) => e.language.name === 'en')?.short_effect || flavor(r);
  }
  genus(r: Resource) {
    return r.genera.find((g) => g.language.name === 'en')?.genus;
  }
  totalStats(r: Resource) {
    return r.stats.reduce((sum, s) => sum + s.base_stat, 0);
  }
  sortedMoves(r: Resource) {
    return [...r.moves].sort((a, b) => human(a.name).localeCompare(human(b.name)));
  }
  async changeGame(event: Event) {
    this.game.set((event.target as HTMLSelectElement).value);
    const params = new URLSearchParams(location.search);
    params.set('game', this.game());
    history.replaceState({}, '', this.url(params));
    await this.loadMoves();
  }
  async loadMoves() {
    const p = this.pokemon();
    if (!p) return;
    const groups = new Map<string, MoveRow[]>();
    await Promise.all(
      p.moves.map(async (m) => {
        const details = m.version_group_details.filter((d) => d.version_group.name === this.game());
        if (!details.length) return;
        const move = await this.api.get(m.move.url);
        for (const d of details) {
          const name = d.move_learn_method.name;
          const rows = groups.get(name) || [];
          rows.push({
            level: d.level_learned_at,
            name: english(move),
            apiName: move.name,
            type: move.type.name,
            category: human(move.damage_class.name),
            power: move.power,
            accuracy: move.accuracy,
            pp: move.pp,
          });
          groups.set(name, rows);
        }
      }),
    );
    const order = ['level-up', 'machine', 'egg', 'tutor'];
    const rank = (s: string) => (order.includes(s) ? order.indexOf(s) : 4);
    this.tables.set(
      [...groups]
        .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
        .map(([name, rows]) => ({
          name,
          rows: rows.sort(
            (a, b) => (name === 'level-up' ? a.level - b.level : 0) || a.name.localeCompare(b.name),
          ),
        })),
    );
  }
  columns(t: MoveTable) {
    return t.name === 'level-up'
      ? ['Level', 'Move', 'Type', 'Category', 'Power', 'Accuracy', 'PP']
      : ['Move', 'Type', 'Category', 'Power', 'Accuracy', 'PP'];
  }
  sort(table: MoveTable, column: string) {
    const direction =
      table.column === column && table.direction === 'ascending' ? 'descending' : 'ascending';
    const value = (r: MoveRow): string | number | null => {
      switch (column) {
        case 'Level':
          return r.level;
        case 'Move':
          return r.name;
        case 'Type':
          return human(r.type);
        case 'Category':
          return r.category;
        case 'Power':
          return r.power;
        case 'Accuracy':
          return r.accuracy;
        default:
          return r.pp;
      }
    };
    this.tables.update((tables) =>
      tables.map((t) =>
        t.name !== table.name
          ? t
          : {
              ...t,
              column,
              direction,
              rows: [...t.rows].sort((a, b) => {
                const av = value(a),
                  bv = value(b);
                if (av == null) return bv == null ? 0 : 1;
                if (bv == null) return -1;
                const result =
                  typeof av === 'number' && typeof bv === 'number'
                    ? av - bv
                    : String(av).localeCompare(String(bv));
                return result * (direction === 'ascending' ? 1 : -1);
              }),
            },
      ),
    );
  }
}
