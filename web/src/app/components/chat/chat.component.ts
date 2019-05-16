import { Component, OnInit, ViewChildren, ViewChild, AfterViewInit, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MatList, MatListItem, MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';

import { ChatService } from '../../services/chat.service';
import { CryptoService } from '../../services/crypto.service';

import { Action, User, Message, Event, DialogUserType, Channel, DialogParams } from '../../models';
import { DialogUserComponent } from '../dialog-user/dialog-user.component';
import { Router } from '@angular/router';

const  WELCOMEMESSAGE = `
  Welcome to safer.chat, a really good place to chat,
  all the messages here are end-to-end encrypted which
  means that only the participants in the channel can read them.
  share your channel name and password and enjoy`;

const POP_UP_MSJ_DURATION_MS = 1000; // 10 seg
const INTERVAL_FOR_CONNECTION_MS = 60000; // 60 seg

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {

  event = Event;
  action = Action;
  user: User;
  channel: Channel;
  peers: User[] = [];
  messages: Message[] = [];
  messageContent: string;
  dialogRef: MatDialogRef<DialogUserComponent> | null;
  errorMessages: MatSnackBarRef<SimpleSnackBar>;
  intervalForConection;

  dialogParams: DialogParams;

  constructor(
    private cryptoService: CryptoService,
    private chatService: ChatService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router ) {}

  // getting a reference to the overall list, which is the parent container of the list items
  @ViewChild(MatList, { read: ElementRef }) matList: ElementRef;

  // getting a reference to the items/messages within the list
  @ViewChildren(MatListItem, { read: ElementRef }) matListItems: QueryList<MatListItem>;

  ngOnInit(): void {
    this.user = this.chatService.getUser();
    if (this.user === undefined) {
      this.router.navigateByUrl('');
    }

    this.channel = this.chatService.getChannnel();
    this.peers = this.chatService.getInitialPeers();

    this. showActivePeers();
    this.initIoConnection();

    this.intervalForConection = setInterval(() => {
      this.sendEmptyMessage(this.chatService);
    }, INTERVAL_FOR_CONNECTION_MS);

    window.onunload = window.onbeforeunload = () => {
      return confirm('Are you sure to reload the page?  al data will be lost');
    };
  }

  private showActivePeers() {
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

    if (this.errorMessages !== undefined) {
      this.errorMessages.dismiss();
    }

    switch (message.type) {
      case Event.PEER_JOINED:
      {
        const publicKey = await this.cryptoService.decodeBase64PublicKey(message.data.who.key);
        const newPeer: User = new User(message.data.who.name, publicKey, message.data.who.key);
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

  private manageErrors(error) {
    this.errorMessages = this.snackBar.open('The server is not available, try again later');
    this.reconnectSocket();
  }

  private reconnectSocket() {
    setTimeout(() => this.initIoConnection(), 1000);
  }

  private sendEmptyMessage(chatService: ChatService) {
    this.chatService.connect();
    chatService.send({});
  }

  ngAfterViewInit(): void {
    // subscribing to any changes in the list of items / messages
    this.matListItems.changes.subscribe(elements => {
      this.scrollToBottom();
    });
  }

  private scrollToBottom(): void {
    try {
      this.matList.nativeElement.scrollTop = this.matList.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  public sendMessage(messageContent: string) {
    let message: any;

    if (!messageContent) {
      return;
    }

    this.peers.forEach(peer => {
      this.cryptoService
        .encrypt(messageContent, peer.publicKey)
        .then(encryptedMessage => {
          message = {
            type: Action.SENDMESSAGE,
            data: {
              to: peer.name,
              message: encryptedMessage
            }
          };
          this.chatService.send(message);
        });
    });

    this.messages.push(new Message(this.user, Event.MESSAGE_RECEIVED, messageContent));
    this.messageContent = '';
  }

  private leaveChannel() {
    const message =  { type: Action.LEFT };
    this.chatService.send(message);
  }

  public onClickUserInfo() {
    this.openUserPopup({ });
  }

  private openUserPopup(params): void {
    this.dialogRef = this.dialog.open(DialogUserComponent, params);
    this.dialogRef.afterClosed().subscribe(async paramsDialog => {
      if (!paramsDialog) {
        return;
      }

      if (paramsDialog.logout) {
        this.leaveChannel();
        this.chatService.setChannnel(undefined);
        this.chatService.setUser(undefined);
        this.router.navigateByUrl('');
      }
    });
  }
}
