import {Component,inject,signal,OnDestroy} from '@angular/core';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {Api} from '../api';
import {Ability,Move,TypeData,Card,english,human,effectText,flavor} from '../models';
import {Cards} from '../cards/cards';
import {NotFound} from '../not-found/not-found';
@Component({selector:'app-resource-page',imports:[RouterLink,Cards,NotFound],templateUrl:'./resource-page.html'})
export class ResourcePage implements OnDestroy {
  api=inject(Api);route=inject(ActivatedRoute);move=signal<Move|undefined>(undefined);ability=signal<Ability|undefined>(undefined);type=signal<TypeData|undefined>(undefined);cards=signal<Card[]>([]);error=signal(false);loading=signal(true);
  english=english;human=human;effectText=effectText;flavor=flavor;
  relations=[['Super effective against','double_damage_to'],['Not very effective against','half_damage_to'],['No effect against','no_damage_to'],['Weak to','double_damage_from'],['Resists','half_damage_from'],['Immune to','no_damage_from']];
  private revision=0;
  private sub=this.route.paramMap.subscribe(async params=>{const n=++this.revision;const kind=this.route.snapshot.data['kind'];this.loading.set(true);this.error.set(false);this.move.set(undefined);this.ability.set(undefined);this.type.set(undefined);
    try {
      const resource=kind==='moves'?'move':kind==='abilities'?'ability':'type';const name=params.get('name');
      if(resource==='type'&&['stellar','unknown','shadow'].includes(name||''))throw new Error('Unsupported type');
      const value=await this.api.get<Move|Ability|TypeData>(resource+'/'+name+'/');
      const refs=resource==='move'?(value as Move).learned_by_pokemon.map(pokemon=>({pokemon})):(value as Ability|TypeData).pokemon;
      const cards=await this.api.cards(refs);if(n!==this.revision)return;
      if(resource==='move')this.move.set(value as Move);else if(resource==='ability')this.ability.set(value as Ability);else this.type.set(value as TypeData);
      this.cards.set(cards);this.loading.set(false);document.title=english(value)+' – Pokédex';
    } catch {if(n===this.revision){this.loading.set(false);this.error.set(true);}}
  });
  sortedMoves(t:TypeData){return t.moves.slice().sort((a,b)=>human(a.name).localeCompare(human(b.name)));}
  ngOnDestroy(){this.sub.unsubscribe();}
}
