import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Chain, human } from '../models';
@Component({selector:'app-evolution',imports:[RouterLink],template:`<ul><li><a [routerLink]="['/pokemon',chain().species.name]">{{human(chain().species.name)}}</a>@for(child of chain().evolves_to;track child.species.name){<app-evolution [chain]="child" />}</li></ul>`})
export class Evolution {chain=input.required<Chain>();human=human;}
