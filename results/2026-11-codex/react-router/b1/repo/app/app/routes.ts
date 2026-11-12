import {index,route} from '@react-router/dev/routes';
export default [index('page.tsx',{id:'home'}),route('*','page.tsx',{id:'page'})];
