import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Chain, human } from "../models";
@Component({
  selector: "app-evolution",
  imports: [RouterLink, Evolution],
  template: `<ul>
    @for (node of nodes(); track node.species.name) {
      <li>
        <a [routerLink]="['/pokemon', node.species.name]">{{
          human(node.species.name)
        }}</a>
        @if (node.evolves_to.length) {
          <app-evolution [nodes]="node.evolves_to" />
        }
      </li>
    }
  </ul>`,
})
export class Evolution {
  nodes = input.required<Chain[]>();
  human = human;
}
