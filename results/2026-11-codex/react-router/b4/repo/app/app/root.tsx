import {Links,Meta,Outlet,Scripts,ScrollRestoration} from "react-router";
import "./style.css";
export default function Root(){return <html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><Meta/><Links/></head><body><header><div><a href="/">Pokédex</a><nav><a href="/">Pokémon</a><a href="/types">Types</a></nav></div></header><main><Outlet/></main><footer>Data from PokéAPI. Pokémon and Pokémon character names are trademarks of Nintendo.</footer><ScrollRestoration/><Scripts/></body></html>}
