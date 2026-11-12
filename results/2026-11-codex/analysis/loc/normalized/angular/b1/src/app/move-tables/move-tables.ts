import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormField, form } from "@angular/forms/signals";
import { Api } from "../api";
import { Game, Move, PokemonData, human, english } from "../models";
interface Row {
  level: number;
  move: Move;
}
interface Group {
  method: string;
  rows: Row[];
}
type Column =
  "Level" | "Move" | "Type" | "Category" | "Power" | "Accuracy" | "PP";
@Component({
  selector: "app-move-tables",
  imports: [RouterLink, FormField],
  templateUrl: "./move-tables.html",
})
export class MoveTables {
  pokemon = input.required<PokemonData>();
  api = inject(Api);
  route = inject(ActivatedRoute);
  router = inject(Router);
  games = signal<Game[]>([]);
  moves = signal<Map<string, Move>>(new Map());
  selection = signal({
    game: this.route.snapshot.queryParamMap.get("game") || "",
  });
  form = form(this.selection);
  sorts = signal<
    Record<string, { column: Column; direction: "ascending" | "descending" }>
  >({});
  human = human;
  english = english;
  groups = computed(() => {
    const game = this.selection().game;
    const moves = this.moves();
    const groups = new Map<string, Row[]>();
    for (const entry of this.pokemon().moves) {
      const move = moves.get(entry.move.name);
      if (!move) continue;
      for (const d of entry.version_group_details.filter(
        (d) => d.version_group.name === game,
      )) {
        const key = d.move_learn_method.name;
        const rows = groups.get(key) || [];
        rows.push({ level: d.level_learned_at, move });
        groups.set(key, rows);
      }
    }
    const priority = ["level-up", "machine", "egg", "tutor"];
    const rank = (name: string) =>
      priority.includes(name) ? priority.indexOf(name) : 4;
    return [...groups]
      .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
      .map(([method, rows]) => ({ method, rows: this.sorted(method, rows) }));
  });
  constructor() {
    effect(() => {
      const p = this.pokemon();
      this.moves.set(new Map());
      const refs = [
        ...new Map(
          p.moves.flatMap((m) =>
            m.version_group_details.map(
              (d) => [d.version_group.name, d.version_group] as const,
            ),
          ),
        ).values(),
      ];
      Promise.all(refs.map((r) => this.api.get<Game>(r.url))).then((g) => {
        if (this.pokemon() !== p) return;
        g.sort((a, b) => a.order - b.order);
        this.games.set(g);
        const requested = this.route.snapshot.queryParamMap.get("game");
        this.selection.set({
          game:
            g.find((x) => x.name === requested)?.name || g.at(-1)?.name || "",
        });
      });
      Promise.all(p.moves.map((m) => this.api.get<Move>(m.move.url))).then(
        (m) => {
          if (this.pokemon() !== p) return;
          this.moves.set(new Map(m.map((x) => [x.name, x])));
          setTimeout(() => {
            if (location.hash === "#moves")
              document.getElementById("moves")?.scrollIntoView();
          }, 0);
        },
      );
    });
    effect(() => {
      const game = this.selection().game;
      if (!game || !this.games().length) return;
      const defaultGame = this.games().at(-1)?.name;
      if (
        game !== (this.route.snapshot.queryParamMap.get("game") || defaultGame)
      )
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { game: game === defaultGame ? null : game },
          queryParamsHandling: "merge",
          preserveFragment: true,
        });
    });
  }
  columns(method: string): Column[] {
    return method === "level-up"
      ? ["Level", "Move", "Type", "Category", "Power", "Accuracy", "PP"]
      : ["Move", "Type", "Category", "Power", "Accuracy", "PP"];
  }
  value(r: Row, c: Column): string | number | null {
    switch (c) {
      case "Level":
        return r.level;
      case "Move":
        return english(r.move);
      case "Type":
        return human(r.move.type.name);
      case "Category":
        return human(r.move.damage_class.name);
      case "Power":
        return r.move.power;
      case "Accuracy":
        return r.move.accuracy;
      case "PP":
        return r.move.pp;
    }
  }
  sorted(method: string, rows: Row[]) {
    const s = this.sorts()[method];
    return rows.sort((a, b) => {
      if (!s)
        return (
          (method === "level-up" ? a.level - b.level : 0) ||
          english(a.move).localeCompare(english(b.move))
        );
      const x = this.value(a, s.column),
        y = this.value(b, s.column);
      if (x === null) return y === null ? 0 : 1;
      if (y === null) return -1;
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y))) *
          (s.direction === "ascending" ? 1 : -1) ||
        english(a.move).localeCompare(english(b.move))
      );
    });
  }
  sort(method: string, column: Column) {
    this.sorts.update((s) => ({
      ...s,
      [method]: {
        column,
        direction:
          s[method]?.column === column && s[method].direction === "ascending"
            ? "descending"
            : "ascending",
      },
    }));
  }
  ariaSort(method: string, column: Column) {
    const s = this.sorts()[method];
    return s?.column === column ? s.direction : null;
  }
}
