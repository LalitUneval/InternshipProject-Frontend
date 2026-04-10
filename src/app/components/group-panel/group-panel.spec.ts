import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupPanel } from './group-panel';

describe('GroupPanel', () => {
  let component: GroupPanel;
  let fixture: ComponentFixture<GroupPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
