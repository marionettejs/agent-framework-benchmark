import { Component, input } from "@angular/core";
import { Chain, human } from "../data";
@Component({
  selector: "app-evolution",
  imports: [Evolution],
  template: `<ul>
    <li>
      <a [href]="'/pokemon/' + node().species.name">{{
        human(node().species.name)
      }}</a>
      @for (child of node().evolves_to; track child.species.name) {
        <app-evolution [node]="child" />
      }
    </li>
  </ul>`,
})
export class Evolution {
  node = input.required<Chain>();
  human = human;
}
