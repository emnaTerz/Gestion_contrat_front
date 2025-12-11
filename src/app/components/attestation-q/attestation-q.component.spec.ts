import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttestationQComponent } from './attestation-q.component';

describe('AttestationQComponent', () => {
  let component: AttestationQComponent;
  let fixture: ComponentFixture<AttestationQComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttestationQComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttestationQComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
