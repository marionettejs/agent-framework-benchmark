import {Component, computed, effect, inject, signal, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {form, FormField} from '@angular/forms/signals';
import {Api} from '../api';
import {Card, Ref, TypeData, Generation, english, human, idOf} from '../models';
import {Cards} from '../cards/cards';
@Component({selector:'app-home', imports:[FormField, Cards, RouterLink], templateUrl:'./home.html'})
export class Home implements OnDestroy {
  api=inject(Api); route=inject(ActivatedRoute); router=inject(Router);
  filters=signal({q: this.route.snapshot.queryParamMap.get('q') || '', type:this.route.snapshot.queryParamMap.get('type') || '', generation:this.route.snapshot.queryParamMap.get('generation') || ''});
  form=form(this.filters); types=signal<TypeData[]>([]); generations=signal<Generation[]>([]); species=signal<Ref[]>([]); ready=signal(false); cards=signal<Card[]>([]); page=signal(1); loading=signal(true);
  english=english; human=human;
  matches=computed(()=>{const f=this.filters(); let rows=this.species().filter(s=>human(s.name).toLowerCase().includes(f.q.toLowerCase()));
    if(f.type){const ids=new Set(this.types().find(t=>t.name===f.type)?.pokemon.map(p=>idOf(p.pokemon))); rows=rows.filter(s=>ids.has(idOf(s)));}
    if(f.generation){const ids=new Set(this.generations().find(g=>g.name===f.generation)?.pokemon_species.map(idOf)); rows=rows.filter(s=>ids.has(idOf(s)));}
    return rows.slice().sort((a,b)=>idOf(a)-idOf(b));});
  pages=computed(()=>Math.max(1,Math.ceil(this.matches().length/48)));
  private sub=this.route.queryParamMap.subscribe(p=> {this.filters.set({q:p.get('q')||'',type:p.get('type')||'',generation:p.get('generation')||''}); this.page.set(Math.max(1,Number(p.get('page'))||1));});
  constructor(){document.title='Pokédex';
    Promise.all([this.api.types(),this.api.generations(),this.api.list('pokemon-species')]).then(([t,g,s])=>{this.types.set(t);this.generations.set(g);this.species.set(s);this.ready.set(true);});
    effect(()=>{const f=this.filters(); const p=this.route.snapshot.queryParamMap;
      if(['q','type','generation'].some(k=>(p.get(k)||'')!==f[k as keyof typeof f])) void this.router.navigate([], {queryParams:this.params(1), replaceUrl:true});
    });
    let revision=0;
    effect(()=>{if(!this.ready())return; const n=++revision; const page=Math.min(this.page(),this.pages()); const refs=this.matches().slice((page-1)*48,page*48); this.loading.set(true);
      this.api.homeCards(refs).then(cards=>{if(n===revision){this.cards.set(cards);this.loading.set(false);}});
    });
  }
  params(page:number){const f=this.filters(); return {q:f.q||null,type:f.type||null,generation:f.generation||null,page:page===1?null:page};}
  ngOnDestroy(){this.sub.unsubscribe();}
}
