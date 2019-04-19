import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HomeComponent } from './components/home/home.component';
import { ChatService } from './services/chat.service';
import { CryptoService } from './services/crypto.service';
import { SharedModule } from './shared/shared.module';
import { DialogUserComponent } from './components/dialog-user/dialog-user.component';

const config: SocketIoConfig = { url: 'http://localhost:9000/ws', options: {} };

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DialogUserComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SocketIoModule.forRoot(config),
    SharedModule
  ],
  providers: [
    CryptoService,
    ChatService
  ],
  bootstrap: [AppComponent],
  entryComponents: [DialogUserComponent]
})
export class AppModule { }
