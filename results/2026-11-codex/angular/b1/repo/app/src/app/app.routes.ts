import { Routes } from '@angular/router';
export const routes: Routes = [
  {path: '', loadComponent: () => import('./home/home').then(m => m.Home)},
  {path: 'pokemon/:name', loadComponent: () => import('./pokemon/pokemon').then(m => m.Pokemon)},
  {path: 'types', loadComponent: () => import('./type-list/type-list').then(m => m.TypeList)},
  ...['moves', 'abilities', 'types'].map(path => ({path: path + '/:name', loadComponent: () => import('./resource-page/resource-page').then(m => m.ResourcePage), data: {kind: path}})),
  {path: '**', loadComponent: () => import('./not-found/not-found').then(m => m.NotFound)},
];
