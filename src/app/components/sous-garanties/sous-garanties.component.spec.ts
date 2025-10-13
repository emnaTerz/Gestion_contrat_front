import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SousGarantiesComponent } from './sous-garanties.component';

describe('SousGarantiesComponent', () => {
  let component: SousGarantiesComponent;
  let fixture: ComponentFixture<SousGarantiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SousGarantiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SousGarantiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
