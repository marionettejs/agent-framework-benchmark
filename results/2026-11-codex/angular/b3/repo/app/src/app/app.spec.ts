import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { Api } from './api';
import { MoveRow, MoveTable } from './models';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: Api, useValue: { get: () => Promise.reject(new Error('Not found')) } },
      ],
    });
  });

  it('renders a recoverable page when the API resource is missing', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('h1')?.textContent).toBe('Not found');
    expect(element.querySelector('main a')?.getAttribute('href')).toBe('/');
  });

  it('keeps missing power last when switching sort direction', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const app = fixture.componentInstance;
    const row = (name: string, power: number | null): MoveRow => ({
      name,
      power,
      level: 1,
      apiName: name,
      type: 'normal',
      category: 'Physical',
      accuracy: 100,
      pp: 10,
    });
    const table: MoveTable = {
      name: 'level-up',
      rows: [row('Missing', null), row('Strong', 100), row('Weak', 20)],
    };
    app.tables.set([table]);
    app.sort(table, 'Power');
    expect(app.tables()[0].rows.map((r) => r.power)).toEqual([20, 100, null]);
    app.sort(app.tables()[0], 'Power');
    expect(app.tables()[0].rows.map((r) => r.power)).toEqual([100, 20, null]);
  });
});
