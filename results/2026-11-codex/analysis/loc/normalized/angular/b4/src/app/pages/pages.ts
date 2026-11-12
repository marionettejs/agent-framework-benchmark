import { Component, inject, signal, computed, DestroyRef } from "@angular/core";
import { Router, RouterLink, NavigationEnd } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Api } from "../api";
import { Cards } from "../cards/cards";
import { Evolution } from "../evolution/evolution";
import {
  Ref,
  Named,
  Species,
  Pokemon,
  Move,
  Ability,
  Type,
  Generation,
  Game,
  Chain,
  Card,
  MoveRow,
  human,
  english,
  idOf,
  flavor,
} from "../models";
@Component({
  selector: "app-pages",
  imports: [RouterLink, Cards, Evolution],
  templateUrl: "./pages.html",
})
export class Pages {
  api = inject(Api);
  router = inject(Router);
  destroy = inject(DestroyRef);
  human = human;
  english = english;
  flavor = flavor;
  kind = signal("loading");
  heading = signal("");
  cards = signal<Card[]>([]);
  types = signal<Type[]>([]);
  generations = signal<Generation[]>([]);
  q = "";
  type = "";
  generation = "";
  page = 1;
  count = signal(0);
  total = computed(() => Math.max(1, Math.ceil(this.count() / 48)));
  species: Species | null = null;
  pokemon: Pokemon | null = null;
  move: Move | null = null;
  ability: Ability | null = null;
  typeData: Type | null = null;
  chain: Chain | null = null;
  games = signal<Game[]>([]);
  game = "";
  rows = signal<Record<string, MoveRow[]>>({});
  sorts = signal<Record<string, { key: keyof MoveRow; desc: boolean }>>({});
  methods = computed(() =>
    Object.keys(this.rows()).sort((a, b) => {
      const order = ["level-up", "machine", "egg", "tutor"];
      return (
        (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) -
          (order.indexOf(b) < 0 ? 99 : order.indexOf(b)) ||
        human(a).localeCompare(human(b))
      );
    }),
  );
  relations = [
    ["Super effective against", "double_damage_to"],
    ["Not very effective against", "half_damage_to"],
    ["No effect against", "no_damage_to"],
    ["Weak to", "double_damage_from"],
    ["Resists", "half_damage_from"],
    ["Immune to", "no_damage_from"],
  ];
  statLabels: Record<string, string> = {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  };
  moveLinks: Ref[] = [];
  effect = "";
  private revision = 0;
  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
      if (e instanceof NavigationEnd) void this.load();
    });
    void this.load();
  }
  async load() {
    const rev = ++this.revision;
    const url = new URL(location.href);
    const parts = url.pathname.split("/").filter(Boolean);
    const params = url.searchParams;
    try {
      if (!parts.length) {
        this.q = params.get("q") || "";
        this.type = params.get("type") || "";
        this.generation = params.get("generation") || "";
        this.page = Math.max(1, Number(params.get("page")) || 1);
        const [refs, types, gens] = await Promise.all([
          this.api.list("pokemon-species"),
          this.getTypes(),
          this.getGenerations(),
        ]);
        let filtered = refs.filter((r) =>
          human(r.name).toLowerCase().includes(this.q.toLowerCase()),
        );
        if (this.type) {
          const ids = new Set(
            types
              .find((t) => t.name === this.type)
              ?.pokemon.map((r) => idOf(r.pokemon)),
          );
          filtered = filtered.filter((r) => ids.has(idOf(r)));
        }
        if (this.generation) {
          const ids = new Set(
            gens
              .find((g) => g.name === this.generation)
              ?.pokemon_species.map(idOf),
          );
          filtered = filtered.filter((r) => ids.has(idOf(r)));
        }
        filtered.sort((a, b) => idOf(a) - idOf(b));
        const cards = await this.api.cards(
          filtered
            .slice((this.page - 1) * 48, this.page * 48)
            .map((pokemon) => ({ pokemon })),
          true,
        );
        if (rev !== this.revision) return;
        this.types.set(types);
        this.generations.set(gens);
        this.count.set(filtered.length);
        this.cards.set(cards);
        this.show("home", "Pokémon");
      } else if (parts[0] === "types" && parts.length === 1) {
        this.types.set(await this.getTypes());
        if (rev === this.revision) this.show("types", "Types");
      } else if (parts.length === 2 && parts[0] === "pokemon") {
        const species = await this.api.get<Species>(
          `pokemon-species/${parts[1]}/`,
        );
        const [p, chain] = await Promise.all([
          this.api.get<Pokemon>(`pokemon/${species.id}/`),
          this.api.get<{ chain: Chain }>(species.evolution_chain.url),
        ]);
        const gameNames = [
          ...new Set(
            p.moves.flatMap((m) =>
              m.version_group_details.map((v) => v.version_group.name),
            ),
          ),
        ];
        const games = (
          await Promise.all(
            gameNames.map((n) => this.api.get<Game>(`version-group/${n}/`)),
          )
        ).sort((a, b) => a.order - b.order);
        const game =
          games.find((g) => g.name === params.get("game"))?.name ||
          games.at(-1)?.name ||
          "";
        const rows = await this.getMoves(p, game);
        if (rev !== this.revision) return;
        this.species = species;
        this.pokemon = p;
        this.chain = chain.chain;
        this.games.set(games);
        this.game = game;
        this.rows.set(rows);
        this.sorts.set({});
        this.show("pokemon", english(species));
      } else if (
        parts.length === 2 &&
        ["moves", "abilities", "types"].includes(parts[0])
      ) {
        const resource = { moves: "move", abilities: "ability", types: "type" }[
          parts[0]
        ]!;
        const data = await this.api.get<Move | Ability | Type>(
          `${resource}/${parts[1]}/`,
        );
        let refs: { pokemon: Ref; is_hidden?: boolean }[] = [];
        if (resource === "move") {
          const m = data as Move;
          this.move = m;
          this.effect =
            m.effect_entries.find((e) => e.language.name === "en")
              ?.short_effect || flavor(m);
          refs = m.learned_by_pokemon.map((pokemon) => ({ pokemon }));
        }
        if (resource === "ability") {
          const a = data as Ability;
          this.ability = a;
          this.effect =
            a.effect_entries.find((e) => e.language.name === "en")
              ?.short_effect || "—";
          refs = a.pokemon;
        }
        if (resource === "type") {
          const t = data as Type;
          if (["stellar", "unknown", "shadow"].includes(t.name)) throw Error();
          this.typeData = t;
          refs = t.pokemon;
          this.moveLinks = [...t.moves].sort((a, b) =>
            human(a.name).localeCompare(human(b.name)),
          );
        }
        const cards = await this.api.cards(refs);
        if (rev !== this.revision) return;
        this.cards.set(cards);
        this.show(resource, english(data));
      } else throw Error();
    } catch {
      if (rev === this.revision) this.show("not-found", "Not found");
    }
  }
  show(kind: string, heading: string) {
    this.kind.set(kind);
    this.heading.set(heading);
    document.title = kind === "home" ? "Pokédex" : `${heading} – Pokédex`;
    if (location.hash)
      setTimeout(
        () => document.getElementById(location.hash.slice(1))?.scrollIntoView(),
        50,
      );
  }
  async getTypes() {
    return Promise.all(
      (await this.api.list("type"))
        .filter((t) => !["stellar", "unknown", "shadow"].includes(t.name))
        .map((t) => this.api.get<Type>(t.url)),
    );
  }
  async getGenerations() {
    return Promise.all(
      (await this.api.list("generation")).map((g) =>
        this.api.get<Generation>(g.url),
      ),
    );
  }
  valueOf(event: Event) {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
  filter(key: string, value: string) {
    const params = new URLSearchParams(location.search);
    value ? params.set(key, value) : params.delete(key);
    params.delete("page");
    void this.router.navigateByUrl("/" + (params.size ? "?" + params : ""));
  }
  pageUrl(page: number) {
    const params = new URLSearchParams(location.search);
    page === 1 ? params.delete("page") : params.set("page", String(page));
    return "/" + (params.size ? "?" + params : "");
  }
  changeGame(value: string) {
    const u = new URL(location.href);
    u.searchParams.set("game", value);
    void this.router.navigateByUrl(u.pathname + u.search + u.hash);
  }
  async getMoves(p: Pokemon, game: string) {
    const result: Record<string, MoveRow[]> = {};
    await Promise.all(
      p.moves.map(async (item) => {
        const details = item.version_group_details.filter(
          (d) => d.version_group.name === game,
        );
        if (!details.length) return;
        const m = await this.api.get<Move>(item.move.url);
        for (const d of details) {
          (result[d.move_learn_method.name] ??= []).push({
            level: d.level_learned_at,
            name: m.name,
            label: english(m),
            type: m.type.name,
            typeLabel: human(m.type.name),
            category: human(m.damage_class.name),
            power: m.power,
            accuracy: m.accuracy,
            pp: m.pp,
          });
        }
      }),
    );
    return result;
  }
  columns(method: string): { label: string; key: keyof MoveRow }[] {
    return [
      ...(method === "level-up"
        ? [{ label: "Level", key: "level" as const }]
        : []),
      { label: "Move", key: "label" },
      { label: "Type", key: "typeLabel" },
      { label: "Category", key: "category" },
      { label: "Power", key: "power" },
      { label: "Accuracy", key: "accuracy" },
      { label: "PP", key: "pp" },
    ];
  }
  sorted(method: string) {
    const sort = this.sorts()[method];
    return [...this.rows()[method]].sort((a, b) => {
      if (!sort)
        return (
          (method === "level-up" ? a.level - b.level : 0) ||
          a.label.localeCompare(b.label)
        );
      const x = a[sort.key],
        y = b[sort.key];
      if (x === null) return y === null ? 0 : 1;
      if (y === null) return -1;
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y))) * (sort.desc ? -1 : 1) ||
        a.label.localeCompare(b.label)
      );
    });
  }
  sort(method: string, key: keyof MoveRow) {
    this.sorts.update((s) => ({
      ...s,
      [method]: { key, desc: s[method]?.key === key ? !s[method].desc : false },
    }));
  }
  sortDirection(method: string, key: keyof MoveRow) {
    const s = this.sorts()[method];
    return s?.key === key ? (s.desc ? "descending" : "ascending") : null;
  }
  totalStats() {
    return this.pokemon?.stats.reduce((s, v) => s + v.base_stat, 0) || 0;
  }
}
