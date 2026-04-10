import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { DashboardComponent } from './dashboard.component';

// describe('DashboardComponent', () => {

// let component: DashboardComponent;
// let fixture: ComponentFixture<DashboardComponent>;

// beforeEach(async () => {

// await TestBed.configureTestingModule({
// imports:[DashboardComponent]
// }).compileComponents();

// fixture = TestBed.createComponent(DashboardComponent);
// component = fixture.componentInstance;

// fixture.detectChanges();

// });

// it('should create', () => {
// expect(component).toBeTruthy();
// });

// });