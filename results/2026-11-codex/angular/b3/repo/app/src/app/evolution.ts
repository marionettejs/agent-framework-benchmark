import { Component, input } from '@angular/core';
import { Chain } from './models';
import { human } from './api';
@Component({
  selector: 'dex-evolution',
  imports: [Evolution],
  template: `<ul>
    <li>
      <a [href]="'/pokemon/' + chain().species.name">{{ human(chain().species.name) }}</a>
      @for (child of chain().evolves_to; track child.species.name) {
        <dex-evolution [chain]="child" />
      }
    </li>
  </ul>`,
})
export class Evolution {
  chain = input.required<Chain>();
  human = human;
}
