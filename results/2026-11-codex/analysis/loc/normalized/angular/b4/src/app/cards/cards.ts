import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Card, human } from "../models";
@Component({
  selector: "app-cards",
  imports: [RouterLink],
  template: `<ul class="cards">
    @for (c of cards(); track c.id) {
      <li>
        <a [routerLink]="['/pokemon', c.name]"
          ><img [src]="c.sprite" alt="" width="96" height="96" /><span
            class="dex"
            >#{{ c.id.toString().padStart(4, "0") }}</span
          ><span>{{ human(c.name) }}</span>
          @if (c.types) {
            <span class="badges">
              @for (t of c.types; track t.name) {
                <span
                  class="badge"
                  [style.background]="'var(--type-' + t.name + ')'"
                  >{{ human(t.name) }}</span
                >
              }
            </span>
          }
          @if (c.hidden) {
            <span class="muted">Hidden ability</span>
          }
        </a>
      </li>
    }
  </ul>`,
})
export class Cards {
  cards = input.required<Card[]>();
  human = human;
}
