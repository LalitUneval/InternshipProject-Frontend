import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyedJobs } from './applyed-jobs';

describe('ApplyedJobs', () => {
  let component: ApplyedJobs;
  let fixture: ComponentFixture<ApplyedJobs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyedJobs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplyedJobs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
