import {Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Card, human, dex} from '../models';
@Component({selector:'app-cards', imports:[RouterLink], template:`
<ul class="cards">@for (card of cards(); track card.id) {
<li><a [routerLink]="['/pokemon',card.name]" class="card">
<img [src]="card.sprite" alt="" width="96" height="96" loading="lazy" />
<span class="dex">{{dex(card.id)}}</span><span>{{human(card.name)}}</span>
@if(card.types) {<span class="badges">@for(type of card.types; track type.name) {<span class="badge" [style.background]="'var(--type-' + type.name + ')'">{{human(type.name)}}</span>}</span>}
@if(card.hidden) {<span class="muted small">Hidden ability</span>}
</a></li>}
</ul>`})
export class Cards {cards=input.required<Card[]>(); human=human; dex=dex;}
