import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BlockUI, NgBlockUI, BlockUIModule } from 'ng-block-ui';
import { CryptoService } from './services/crypto.service';
import { routes } from './app-routing.module'
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { HomeComponent } from './components/home/home.component';
import { ChatComponent } from './components/chat/chat.component';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        BlockUIModule.forRoot({
          message: 'Loading..'
        }),
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [
        AppComponent,
        HomeComponent,
        ChatComponent
      ],
      providers: [
        CryptoService,
        { provide: MatSnackBar, value: {} }
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ]
    }).compileComponents();

    router = TestBed.get(Router)
    router.initialNavigation();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toEqual('Secure chat on your computer or smartphone');
  });
});
