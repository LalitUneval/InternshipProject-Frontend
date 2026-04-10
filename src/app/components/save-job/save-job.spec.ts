import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveJob } from './save-job';

describe('SaveJob', () => {
  let component: SaveJob;
  let fixture: ComponentFixture<SaveJob>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveJob]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveJob);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
