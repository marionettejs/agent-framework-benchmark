import {Component,inject,signal,OnDestroy} from '@angular/core';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {Api} from '../api';
import {PokemonData,Species,Chain,english,human,dex,flavor} from '../models';
import {Evolution} from '../evolution/evolution';
import {MoveTables} from '../move-tables/move-tables';
import {NotFound} from '../not-found/not-found';
@Component({selector:'app-pokemon',imports:[RouterLink,Evolution,MoveTables,NotFound],templateUrl:'./pokemon.html'})
export class Pokemon implements OnDestroy {
  api=inject(Api); route=inject(ActivatedRoute); species=signal<Species|undefined>(undefined); pokemon=signal<PokemonData|undefined>(undefined);chain=signal<Chain|undefined>(undefined);error=signal(false);
  english=english;human=human;dex=dex;flavor=flavor;
  labels:Record<string,string>={'hp':'HP','attack':'Attack','defense':'Defense','special-attack':'Sp. Atk','special-defense':'Sp. Def','speed':'Speed'};
  private revision=0;
  private sub=this.route.paramMap.subscribe(async params=>{const n=++this.revision;this.error.set(false);this.species.set(undefined);this.pokemon.set(undefined);this.chain.set(undefined);
    try {const species=await this.api.get<Species>('pokemon-species/'+params.get('name')+'/');
      const [p,c]=await Promise.all([this.api.get<PokemonData>('pokemon/'+species.id+'/'),this.api.get<{chain:Chain}>(species.evolution_chain.url)]);
      if(n!==this.revision)return;this.species.set(species);this.pokemon.set(p);this.chain.set(c.chain); document.title=english(species)+' – Pokédex';
    }catch{if(n===this.revision)this.error.set(true);}
  });
  total(p:PokemonData){return p.stats.reduce((sum,s)=>sum+s.base_stat,0);}
  ngOnDestroy(){this.sub.unsubscribe();}
}
