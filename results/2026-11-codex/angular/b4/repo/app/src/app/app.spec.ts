import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
describe('Shared layout',()=>{
  it('provides navigation and the data attribution',async()=>{
    await TestBed.configureTestingModule({imports:[App],providers:[provideRouter([])]}).compileComponents();
    const fixture=TestBed.createComponent(App);
    await fixture.whenStable();
    const element=fixture.nativeElement as HTMLElement;
    expect(element.querySelector('header .brand')?.textContent).toBe('Pokédex');
    expect(element.querySelectorAll('nav a').length).toBe(2);
    expect(element.querySelector('footer')?.textContent).toContain('Data from PokéAPI.');
  });
});
