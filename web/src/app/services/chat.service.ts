import { Injectable } from '@angular/core';

import { Subject, BehaviorSubject} from 'rxjs';
import { map } from 'rxjs/operators';
import { WebSocketService } from './webSocket.service';
import { environment } from '../../environments/environment';
import { Channel, User, Event, Action} from '../models';


@Injectable({
  providedIn: 'root',
})
export class ChatService {

    public messages: Subject<any>;
    private channel: Channel;
    private user: User;
    private peers: User[] = [];

    constructor(private wsService: WebSocketService) { }

    public connect() {
      this.messages = <Subject<any>>this.wsService
        .connect(environment.SERVER_URL)
        .pipe(map( response => JSON.parse(response.data) ) );
    }

    public setChannnel(channel: Channel) {
      this.channel = channel;
    }

    public getChannnel() {
      return this.channel;
    }

    public setInitialPeers(peers: User[]) {
      this.peers = peers;
    }

    public getInitialPeers() {
      return this.peers;
    }

    public setUser(user: User) {
      this.user = user;
    }

    public getUser() {
      return this.user;
    }

    public close() {
      this.wsService.close();
    }

    public send(message) {
      this.messages.next(message);
    }

    public sendBrowserNotification (user: string, type: string) {

      let notificationMsj: string;

      if (document.hasFocus()) {
        return;
      }

      switch (type) {
        case Event.MESSAGE_RECEIVED : {
          notificationMsj = `New message from ${user}`;
          break;
        }
        case Event.PEER_JOINED: {
          notificationMsj = `${user} joined the channel`;
          break;
        }
        case Event.PEER_LEFT: {
          notificationMsj = `${user} left the channel`;
          break;
        }
      }

      if (!('Notification' in window)) {
        return;
      } else if (Notification.permission === 'granted') {
        const _ = new Notification(notificationMsj);
      }
    }

    public JoinChannel(user: User,  channel: Channel): void {
     const message = {
        type : Action.JOIN,
        data : {
          channel : channel.name,
          secret : channel.sha256Secret,
          name : {
            name : user.name,
            key: user.base64EncodedPublicKey
          }
        }
      };

      this.send(message);
    }
}
