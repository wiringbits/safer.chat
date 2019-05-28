import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BlockUI, NgBlockUI, BlockUIModule } from 'ng-block-ui';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HomeComponent } from './components/home/home.component';
import { ChatService } from './services/chat.service';
import { CryptoService } from './services/crypto.service';
import { SharedModule } from './shared/shared.module';
import { DialogUserComponent } from './components/dialog-user/dialog-user.component';
import { ChatComponent } from './components/chat/chat.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DialogUserComponent,
    ChatComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SharedModule,
    ToastrModule.forRoot(),
    BlockUIModule.forRoot({
      message: 'Loading..'
    })

  ],
  providers: [
    CryptoService,
    ChatService
  ],
  bootstrap: [AppComponent],
  entryComponents: [DialogUserComponent]
})
export class AppModule { }
