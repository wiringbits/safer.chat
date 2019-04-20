import { Component, OnInit } from '@angular/core';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'Safer Chat';
  channelName = '';

  constructor(private chat: ChatService) {}

  ngOnInit(): void {
    this.chat.channelName.subscribe(
      channelName => this.channelName = channelName
    );

    Notification.requestPermission();
  }
}
