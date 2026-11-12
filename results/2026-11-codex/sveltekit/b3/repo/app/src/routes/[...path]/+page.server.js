import {loadPage} from '#lib/api.js';
export async function load({url}){try{return await loadPage(url)}catch{return {kind:'missing',title:'Not found'}}}
