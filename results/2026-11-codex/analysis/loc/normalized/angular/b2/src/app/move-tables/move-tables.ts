import { Component, input, signal, effect } from "@angular/core";
import { Pokemon, Move, Ref, api, human, english } from "../data";
interface Row {
  level: number;
  move: Move;
  name: string;
}
interface Group {
  name: string;
  rows: Row[];
  column: string;
  descending: boolean;
}
@Component({
  selector: "app-move-tables",
  template: `
    <div class="game">
      <label for="game">Game</label>
      <select id="game" (change)="change($any($event.target).value)">
        @for (g of games(); track g.name) {
          <option [value]="g.name" [selected]="game() === g.name">
            {{ human(g.name) }}
          </option>
        }
      </select>
    </div>
    @for (group of groups(); track group.name) {
      <div class="table-wrap">
        <table class="moves-table">
          <caption>
            {{
              human(group.name)
            }}
          </caption>
          <thead>
            <tr>
              @for (col of columns(group); track col) {
                <th
                  (click)="sort(group, col)"
                  [attr.aria-sort]="
                    group.column === col
                      ? group.descending
                        ? 'descending'
                        : 'ascending'
                      : null
                  "
                >
                  <button>{{ col }}</button>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of group.rows; track row.move.name) {
              <tr>
                @if (group.name === "level-up") {
                  <td>{{ row.level }}</td>
                }
                <td>
                  <a [href]="'/moves/' + row.move.name">{{ row.name }}</a>
                </td>
                <td>
                  <a
                    class="badge"
                    [style.background]="
                      'var(--type-' + row.move.type.name + ')'
                    "
                    [href]="'/types/' + row.move.type.name"
                    >{{ human(row.move.type.name) }}</a
                  >
                </td>
                <td>{{ human(row.move.damage_class.name) }}</td>
                <td>{{ row.move.power ?? "—" }}</td>
                <td>{{ row.move.accuracy ?? "—" }}</td>
                <td>{{ row.move.pp ?? "—" }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class MoveTables {
  pokemon = input.required<Pokemon>();
  games = signal<(Ref & { order: number })[]>([]);
  game = signal("");
  groups = signal<Group[]>([]);
  human = human;
  constructor() {
    effect(() => {
      const p = this.pokemon();
      this.init(p);
    });
  }
  async init(p: Pokemon) {
    const refs = new Map<string, Ref>();
    p.moves.forEach((m) =>
      m.version_group_details.forEach((d) =>
        refs.set(d.version_group.name, d.version_group),
      ),
    );
    const games = await Promise.all(
      [...refs.values()].map((r) => api<Ref & { order: number }>(r.url)),
    );
    games.sort((a, b) => a.order - b.order);
    this.games.set(games);
    this.game.set(
      new URLSearchParams(location.search).get("game") ||
        games.at(-1)?.name ||
        "",
    );
    await this.build();
    if (location.hash === "#moves")
      setTimeout(() => document.getElementById("moves")?.scrollIntoView(), 0);
  }
  change(game: string) {
    this.game.set(game);
    const url = new URL(location.href);
    url.searchParams.set("game", game);
    history.pushState(null, "", url);
    this.build();
  }
  async build() {
    const game = this.game();
    const entries = this.pokemon().moves.filter((m) =>
      m.version_group_details.some((d) => d.version_group.name === game),
    );
    const moves = await Promise.all(entries.map((m) => api<Move>(m.move.url)));
    if (game !== this.game()) return;
    const groups = new Map<string, Row[]>();
    entries.forEach((e, i) =>
      e.version_group_details
        .filter((d) => d.version_group.name === game)
        .forEach((d) => {
          const key = d.move_learn_method.name;
          const rows = groups.get(key) || [];
          if (!rows.some((r) => r.move.name === moves[i].name))
            rows.push({
              level: d.level_learned_at,
              move: moves[i],
              name: english(moves[i]),
            });
          groups.set(key, rows);
        }),
    );
    const order = ["level-up", "machine", "egg", "tutor"];
    const result = [...groups]
      .sort(([a], [b]) => {
        const x = order.indexOf(a),
          y = order.indexOf(b);
        return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || a.localeCompare(b);
      })
      .map(([name, rows]) => ({
        name,
        rows: rows.sort(
          (a, b) =>
            (name === "level-up" ? a.level - b.level : 0) ||
            a.name.localeCompare(b.name),
        ),
        column: "",
        descending: false,
      }));
    this.groups.set(result);
  }
  columns(g: Group) {
    return [
      ...(g.name === "level-up" ? ["Level"] : []),
      "Move",
      "Type",
      "Category",
      "Power",
      "Accuracy",
      "PP",
    ];
  }
  value(row: Row, col: string): string | number | null {
    switch (col) {
      case "Level":
        return row.level;
      case "Move":
        return row.name;
      case "Type":
        return human(row.move.type.name);
      case "Category":
        return human(row.move.damage_class.name);
      case "Power":
        return row.move.power;
      case "Accuracy":
        return row.move.accuracy;
      default:
        return row.move.pp;
    }
  }
  sort(g: Group, col: string) {
    const descending = g.column === col ? !g.descending : false;
    const rows = [...g.rows].sort((a, b) => {
      const x = this.value(a, col),
        y = this.value(b, col);
      if (x === null) return y === null ? 0 : 1;
      if (y === null) return -1;
      return (
        (typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y))) * (descending ? -1 : 1) ||
        a.name.localeCompare(b.name)
      );
    });
    this.groups.update((groups) =>
      groups.map((x) =>
        x === g ? { ...g, column: col, descending, rows } : x,
      ),
    );
  }
}
