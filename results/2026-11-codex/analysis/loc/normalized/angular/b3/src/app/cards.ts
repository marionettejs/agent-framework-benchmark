import { Component, input } from "@angular/core";
import { Card } from "./models";
import { human, dex } from "./api";
@Component({
  selector: "dex-cards",
  template: `<ul class="cards">
    @for (c of cards(); track c.id) {
      <li>
        <a [href]="'/pokemon/' + c.name"
          ><img [src]="c.image" alt="" width="96" height="96" /><span
            class="number"
            >{{ dex(c.id) }}</span
          ><span>{{ human(c.name) }}</span
          ><span class="badges">
            @for (t of c.types; track t.name) {
              <span
                class="badge"
                [style.background]="'var(--type-' + t.name + ')'"
                >{{ human(t.name) }}</span
              >
            }
          </span>
          @if (c.hidden) {
            <small>Hidden ability</small>
          }
        </a>
      </li>
    }
  </ul>`,
})
export class Cards {
  cards = input.required<Card[]>();
  human = human;
  dex = dex;
}
