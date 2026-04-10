import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { HomeComponent } from './home.component';

// describe('HomeComponent', () => {

// let component:HomeComponent;
// let fixture:ComponentFixture<HomeComponent>;

// beforeEach(async()=>{

// await TestBed.configureTestingModule({
// imports:[HomeComponent]
// }).compileComponents();

// fixture = TestBed.createComponent(HomeComponent);
// component = fixture.componentInstance;

// fixture.detectChanges();

// });

// it('should create',()=>{
// expect(component).toBeTruthy();
// });

// });
