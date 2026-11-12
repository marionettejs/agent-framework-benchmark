import {Links,Meta,Outlet,Scripts,ScrollRestoration,Link} from 'react-router';
import './style.css';
export function Layout({children}) {return <html lang="en"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><Meta/><Links/></head><body><header><div><Link to="/">Pokédex</Link><nav><Link to="/">Pokémon</Link><Link to="/types">Types</Link></nav></div></header><main>{children}</main><footer>Data from PokéAPI. Pokémon and Pokémon character names are trademarks of Nintendo.</footer><ScrollRestoration/><Scripts/></body></html>}
export default function Root(){return <Outlet/>}
