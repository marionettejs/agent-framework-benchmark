import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourcePage } from './resource-page';

describe('ResourcePage', () => {
  let component: ResourcePage;
  let fixture: ComponentFixture<ResourcePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcePage],
    }).compileComponents();

    fixture = TestBed.createComponent(ResourcePage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
