import {Component,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Api} from '../api';
import {TypeData,english} from '../models';
@Component({selector:'app-type-list',imports:[RouterLink],template:`<h1>Types</h1><ul class="type-grid">@for(type of types();track type.id){<li><a [routerLink]="['/types',type.name]" [style.background]="'var(--type-' + type.name + ')'">{{english(type)}}</a></li>}</ul>`})
export class TypeList {types=signal<TypeData[]>([]);english=english;constructor(){document.title='Types – Pokédex';inject(Api).types().then(t=>this.types.set(t));}}
