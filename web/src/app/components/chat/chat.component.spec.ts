import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CryptoService } from '../../services/crypto.service';
import { ChatService } from '../../services/chat.service';
import { RouterTestingModule } from '@angular/router/testing';
import { WebSocketService } from 'src/app/services/webSocket.service';
import { User } from 'src/app/models';

import { ChatComponent } from './chat.component';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(async(() => {
    const chatServiceStub = new ChatService(new WebSocketService(), new CryptoService());
    chatServiceStub.setUser(new User('testuser', 1));

    TestBed.configureTestingModule({
      declarations: [ ChatComponent ],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        CryptoService,
        { provide: ChatService, useValue: chatServiceStub },
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: [] },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
