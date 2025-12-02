import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contrat268Component } from './contrat268.component';

describe('Contrat268Component', () => {
  let component: Contrat268Component;
  let fixture: ComponentFixture<Contrat268Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contrat268Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Contrat268Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
