import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierContratComponentComponent } from './modifier-contrat-component.component';

describe('ModifierContratComponentComponent', () => {
  let component: ModifierContratComponentComponent;
  let fixture: ComponentFixture<ModifierContratComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierContratComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifierContratComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
