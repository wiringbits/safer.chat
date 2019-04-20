import { Injectable } from '@angular/core';

import { Subject, Observable, BehaviorSubject} from 'rxjs';
import { map } from 'rxjs/operators';
import { WebSocketService } from './webSocket.service';
import { environment } from '../../environments/environment';
import { ObserversModule } from '@angular/cdk/observers';

@Injectable()
export class ChatService {

    public messages: Subject<any>;
    private channelSource = new BehaviorSubject('');
    private usersSource = new BehaviorSubject([]);
    public channelName = this.channelSource.asObservable();
    public channelUsers = this.usersSource.asObservable();

    constructor(private wsService: WebSocketService) { }

    public connect() {
      if (this.messages === undefined) {
        this.messages = <Subject<any>>this.wsService
          .connect(environment.SERVER_URL)
          .pipe(map( response => JSON.parse(response.data) ) );
      }
    }

    public setChannnelName(name: string) {
      this.channelSource.next(name);
    }

    public close() {
      this.wsService.close();
    }

    public send(message) {
      this.messages.next(message);
    }
}
