import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
@Component({selector:'app-root', imports:[RouterLink,RouterOutlet],template:`
<header><div class="header-inner"><a routerLink="/" class="brand">Pokédex</a><nav><a routerLink="/">Pokémon</a><a routerLink="/types">Types</a></nav></div></header>
<main><router-outlet /></main><footer>Data from PokéAPI. Pokémon and Pokémon character names are trademarks of Nintendo.</footer>`})
export class App {}
