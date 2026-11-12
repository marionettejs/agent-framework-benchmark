export const human = s => s.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
export const english = r => r.names?.find(n=>n.language.name==='en')?.name || human(r.name);
export const flavor = r => r.flavor_text_entries?.filter(e=>e.language.name==='en').at(-1)?.flavor_text.replace(/\s+/g,' ') || '—';
export const id = r => Number((typeof r==='string'?r:r.url).match(/\/(\d+)\/?$/)?.[1]);
export const dex = n => '#'+String(n).padStart(4,'0');
