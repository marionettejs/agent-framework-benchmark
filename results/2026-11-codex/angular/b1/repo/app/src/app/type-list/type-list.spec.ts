import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TypeList } from './type-list';

describe('TypeList', () => {
  let component: TypeList;
  let fixture: ComponentFixture<TypeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeList],
    }).compileComponents();

    fixture = TestBed.createComponent(TypeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
