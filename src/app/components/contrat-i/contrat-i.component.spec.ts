import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratIComponent } from './contrat-i.component';

describe('ContratIComponent', () => {
  let component: ContratIComponent;
  let fixture: ComponentFixture<ContratIComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratIComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratIComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
