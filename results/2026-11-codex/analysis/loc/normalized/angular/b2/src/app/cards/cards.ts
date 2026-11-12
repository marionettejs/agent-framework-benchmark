import { Component, input } from "@angular/core";
import { Card, human } from "../data";
@Component({
  selector: "app-cards",
  template: `<ul class="cards">
    @for (c of items(); track c.id) {
      <li>
        <a [href]="'/pokemon/' + c.name"
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
            <small>Hidden ability</small>
          }
        </a>
      </li>
    }
  </ul>`,
})
export class Cards {
  items = input.required<Card[]>();
  human = human;
}
