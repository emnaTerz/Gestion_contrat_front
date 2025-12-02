import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contrat260Component } from './contrat260.component';

describe('Contrat260Component', () => {
  let component: Contrat260Component;
  let fixture: ComponentFixture<Contrat260Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contrat260Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Contrat260Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
