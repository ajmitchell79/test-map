import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StormTracksComponent } from './storm-tracks.component';

describe('StormTracksComponent', () => {
  let component: StormTracksComponent;
  let fixture: ComponentFixture<StormTracksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StormTracksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StormTracksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
