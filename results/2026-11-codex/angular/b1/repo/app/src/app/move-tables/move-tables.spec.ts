import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoveTables } from './move-tables';

describe('MoveTables', () => {
  let component: MoveTables;
  let fixture: ComponentFixture<MoveTables>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveTables],
    }).compileComponents();

    fixture = TestBed.createComponent(MoveTables);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
