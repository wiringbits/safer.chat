import { Injectable } from '@angular/core';

import { Subject} from 'rxjs';
import { map } from 'rxjs/operators';
import { Message } from '../models';
import { WebSocketService } from './webSocket.service';
import { environment } from '../../environments/environment';

@Injectable()
export class ChatService {

  public messages: Subject<any>  = new Subject<any>();

    constructor(private wsService: WebSocketService) {
    }

    public connect() {
      this.messages = <Subject<any>>this.wsService
        .connect(environment.SERVER_URL)
        .pipe(map((response: any): any => {
            return JSON.parse(response.data);
        }));
    }

    public close() {
        this.wsService.close();
    }

    public send(message) {
      this.messages.next(message);
    }
}
