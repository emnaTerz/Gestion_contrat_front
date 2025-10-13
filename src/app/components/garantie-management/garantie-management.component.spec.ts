import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GarantieManagementComponent } from './garantie-management.component';

describe('GarantieManagementComponent', () => {
  let component: GarantieManagementComponent;
  let fixture: ComponentFixture<GarantieManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GarantieManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GarantieManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
