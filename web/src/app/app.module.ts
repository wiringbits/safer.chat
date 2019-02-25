import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CreateChannelComponent } from './components/create-channel/create-channel.component';
import { JoinChannelComponent } from './components/join-channel/join-channel.component';
import { HomeComponent } from './components/home/home.component';
import { CryptoService } from './services/crypto.service';

@NgModule({
  declarations: [
    AppComponent,
    CreateChannelComponent,
    JoinChannelComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [
    CryptoService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
