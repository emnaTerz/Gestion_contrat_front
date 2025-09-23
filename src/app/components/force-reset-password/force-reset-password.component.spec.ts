import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForceResetPasswordComponent } from './force-reset-password.component';

describe('ForceResetPasswordComponent', () => {
  let component: ForceResetPasswordComponent;
  let fixture: ComponentFixture<ForceResetPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForceResetPasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForceResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
