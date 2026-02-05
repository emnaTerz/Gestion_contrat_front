import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClauseGarantieComponent } from './clause-garantie.component';

describe('ClauseGarantieComponent', () => {
  let component: ClauseGarantieComponent;
  let fixture: ComponentFixture<ClauseGarantieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClauseGarantieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClauseGarantieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
