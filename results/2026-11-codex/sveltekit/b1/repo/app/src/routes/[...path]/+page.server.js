import {loadPage} from '#lib/api.js';
export async function load({params,url}){try{return await loadPage(params.path,url);}catch{return {kind:'missing',title:'Not found'};}}
