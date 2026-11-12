import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
@Component({
  selector: "app-not-found",
  imports: [RouterLink],
  template: `<h1>Not found</h1>
    <a routerLink="/">Back to Pokémon</a>`,
})
export class NotFound {
  constructor() {
    document.title = "Not found – Pokédex";
  }
}
