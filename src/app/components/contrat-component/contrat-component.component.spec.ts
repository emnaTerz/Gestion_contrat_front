import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratComponentComponent } from './contrat-component.component';

describe('ContratComponentComponent', () => {
  let component: ContratComponentComponent;
  let fixture: ComponentFixture<ContratComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
