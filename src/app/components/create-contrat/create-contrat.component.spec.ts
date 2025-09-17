import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateContratComponent } from './create-contrat.component';

describe('CreateContratComponent', () => {
  let component: CreateContratComponent;
  let fixture: ComponentFixture<CreateContratComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateContratComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateContratComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
