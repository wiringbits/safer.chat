import { Injectable } from '@angular/core';

import { Subject, BehaviorSubject} from 'rxjs';
import { map } from 'rxjs/operators';
import { WebSocketService } from './webSocket.service';
import { environment } from '../../environments/environment';
import { Channel, User } from '../models';


@Injectable({
  providedIn: 'root',
})
export class ChatService {

    public messages: Subject<any>;
    private channel: Channel;
    private user: User;
    private peers: User[];

    constructor(private wsService: WebSocketService) { }

    public connect() {
      if (this.messages === undefined) {
        this.messages = <Subject<any>>this.wsService
          .connect(environment.SERVER_URL)
          .pipe(map( response => JSON.parse(response.data) ) );
      }
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
}
