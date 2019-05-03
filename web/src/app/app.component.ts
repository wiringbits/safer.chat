import { Component, OnInit } from '@angular/core';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private chat: ChatService) {}

  ngOnInit(): void {

    // window.onunload = window.onbeforeunload = () => {
    //   return confirm('Are you sure to reload the page?  al data will be lost ');
    // };

    Notification.requestPermission();
  }
}
