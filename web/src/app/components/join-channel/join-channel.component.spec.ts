import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinChannelComponent } from './join-channel.component';

describe('JoinChannelComponent', () => {
  let component: JoinChannelComponent;
  let fixture: ComponentFixture<JoinChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JoinChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
