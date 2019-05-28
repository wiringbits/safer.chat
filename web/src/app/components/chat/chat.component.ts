import { Component, OnInit, ViewChildren, ViewChild, AfterViewInit, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MatList, MatListItem, MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';

import { ChatService } from '../../services/chat.service';
import { CryptoService } from '../../services/crypto.service';

import { Action, User, Message, Event, DialogUserType, Room, DialogParams } from '../../models';
import { Config } from '../../config';
import { DialogUserComponent } from '../dialog-user/dialog-user.component';
import { Router } from '@angular/router';
import { element } from '@angular/core/src/render3';

const  WELCOME_MESSAGE = `
  If you like our app, remember to give us a start on
  https://github.com/wiringbits/safer.chat as well as to
  submit your feedback on https://forms.gle/M4h4C8T5tvqHLR9q9`;

const POP_UP_MSJ_DURATION_MS = 1000; // 10 seg
const INTERVAL_FOR_CONNECTION_MS = 60000; // 60 seg
const MOBILE_PIXELS = 720;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {

  event = Event;
  action = Action;
  user: User;
  room: Room;
  peers: User[] = [];
  messages: Message[] = [];
  messageContent: string;
  dialogRef: MatDialogRef<DialogUserComponent> | null;
  errorMessages: MatSnackBarRef<SimpleSnackBar>;
  intervalForConection;
  desktop = true;

  dialogParams: DialogParams;

  constructor(
    private cryptoService: CryptoService,
    private chatService: ChatService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router ) {
      this.user = this.chatService.getUser();

      if (this.user === undefined) {
        this.chatService.setRoom(new Room(this.router.url.substring(1), ''));
        this.router.navigateByUrl('');
      }
    }

  // getting a reference to the overall list, which is the parent container of the list items
  @ViewChild(MatList, { read: ElementRef }) matList: ElementRef;

  // getting a reference to the items/messages within the list
  @ViewChildren(MatListItem, { read: ElementRef }) matListItems: QueryList<MatListItem>;

  ngOnInit(): void {

    this.room = this.chatService.getRoom();
    this.peers = this.chatService.getInitialPeers();

    this.initIoConnection();

    this.intervalForConection = setInterval(() => {
      this.sendEmptyMessage(this.chatService);
    }, INTERVAL_FOR_CONNECTION_MS);

    window.onunload = window.onbeforeunload = () => {
      return confirm('Are you sure to reload the page?  al data will be lost');
    };
    this. showActivePeers();
  }

  private showActivePeers(): void {
    if (this.messages.length === 0) {
      this.peers.forEach(peer => {
        this.messages.push(new Message(peer, Event.PEER_JOINED));
      });
    }
  }

  ngOnDestroy(): void {
   clearInterval(this.intervalForConection);
  }

  private initIoConnection(): void {
    this.chatService.connect();

    this.chatService.messages.subscribe(
      message => { this.receiveMessages(message); },
      error   => { this.manageErrors(error); },
      ()      => { this.reconnectSocket(); }
    );
  }

  private async receiveMessages(message) {

    this.snackBar.dismiss();

    switch (message.type) {
      case Event.PEER_JOINED:
      {
        const publicKey = await this.cryptoService.decodeBase64PublicKey(message.data.who.key);
        const newPeer: User = new User(message.data.who.name, this.getNewId(), publicKey, message.data.who.key);
        this.peers.push(newPeer);
        this.messages.push(new Message(newPeer, message.type));
        this.chatService.sendBrowserNotification(newPeer.name, Event.PEER_JOINED);
        break;
      }
      case Event.MESSAGE_RECEIVED:
      {
        const messageDecrypted = await this.cryptoService.decrypt(message.data.message);
        const fromUser: User = this.peers.find(peer => peer.name === message.data.from.name);
        this.messages.push(new Message(fromUser, message.type, messageDecrypted));
        this.chatService.sendBrowserNotification(fromUser.name, Event.MESSAGE_RECEIVED);
        break;
      }
      case Event.PEER_LEFT:
      {
        const userLeft: User = this.peers.find(peer => peer.name === message.data.who.name);
        const indexPeer: number = this.peers.findIndex(peer => peer.name === message.data.who.name);
        this.messages.push(new Message(userLeft, message.type));

        this.peers.splice(indexPeer, 1);
        this.chatService.sendBrowserNotification(userLeft.name, Event.PEER_LEFT);
        break;
      }
      case Event.COMMAND_REJECTED:
      {
        this.openUserPopup(this.dialogParams);
        this.snackBar.open(message.data.reason, 'OK', {duration: POP_UP_MSJ_DURATION_MS});
      }
    }
  }

  private manageErrors(error): void {
    this.errorMessages = this.snackBar.open('The server is not available, try again later');
    this.reconnectSocket();
  }

  private reconnectSocket(): void {
    setTimeout(() => this.initIoConnection(), 1000);
  }

  private sendEmptyMessage(chatService: ChatService): void {
    this.chatService.connect();
    chatService.send({});
  }

  ngAfterViewInit(): void {
    // subscribing to any changes in the list of items / messages
    this.matListItems.changes.subscribe(elements => {
      this.scrollToBottom();
    });
    this.desktop = window.innerWidth > MOBILE_PIXELS;
  }

  private scrollToBottom(): void {
    try {
      this.matList.nativeElement.scrollTop = this.matList.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  public sendMessage(messageContent: string): void {

    if (!messageContent) {
      return;
    }

    this.chatService.sendChatMessage(messageContent);

    this.messages.push(new Message(this.user, Event.MESSAGE_RECEIVED, messageContent));
    this.messageContent = '';
  }

  private leaveRoom(): void {
    const message =  { type: Action.LEFT };
    this.chatService.send(message);
  }

  public onClickUserInfo(): void {
    this.openUserPopup({ });
  }

  private getNewId(): number {
    for (let i = 2; i <= Config.maxPeersPerRoom; i++) {
      if (this.peers.find(peer => peer.id === i) === undefined ) {
        return i;
      }
    }
  }

  private openUserPopup(params): void {
    this.dialogRef = this.dialog.open(DialogUserComponent, params);
    this.dialogRef.afterClosed().subscribe(async paramsDialog => {
      if (!paramsDialog) {
        return;
      }

      if (paramsDialog.logout) {
        this.leaveRoom();
        this.chatService.setRoom(undefined);
        this.chatService.setUser(undefined);
        this.router.navigateByUrl('');
      }
    });
  }
}
