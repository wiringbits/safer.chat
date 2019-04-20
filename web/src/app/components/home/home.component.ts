import { Component, OnInit, ViewChildren, ViewChild, AfterViewInit, QueryList, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MatList, MatListItem, MatSnackBar } from '@angular/material';

import { ChatService } from '../../services/chat.service';
import { CryptoService } from '../../services/crypto.service';

import { Action, User, Message, Event, DialogUserType, Channel } from '../../models';
import { DialogUserComponent } from '../dialog-user/dialog-user.component';

const  WELCOMEMESSAGE = `
  Welcome to safer.chat, a really good place to chat,
  all the messages here are end-to-end encrypted which
  means that only the participants in the channel can read them.
  share your channel name and password and enjoy`;

const SAFERCHAT = 'safer.chat';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  action = Action;
  user: User;
  channel: Channel;
  peers: User[] = [];
  messages: Message[] = [];
  messageContent: string;
  ioConnection: any;
  dialogRef: MatDialogRef<DialogUserComponent> | null;
  errorsMessages: any;
  defaultDialogUserParams: any = {
    disableClose: true,
    data: {
      nickname: '',
      channel: '',
      secret: '',
      title: 'Welcome to the safer.chat',
      dialogType: DialogUserType.NEW
    }
  };

  constructor(
    private chat: ChatService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cryptoService: CryptoService ) {}

  // getting a reference to the overall list, which is the parent container of the list items
  @ViewChild(MatList, { read: ElementRef }) matList: ElementRef;

  // getting a reference to the items/messages within the list
  @ViewChildren(MatListItem, { read: ElementRef }) matListItems: QueryList<MatListItem>;


  ngOnInit(): void {
    setTimeout(() => {
      this.openUserPopup(this.defaultDialogUserParams);
    }, 0);

    this.initIoConnection();

    setInterval(() => {
      this.sendEmptyMessage(this.chat);
    }, 60000);
  }

  private initIoConnection(): void {
    this.chat.connect();

    this.chat.messages.subscribe(
      message => {
        this.receiveMessages(message);
      },
      error => {
        this.errorsMessages = this.snackBar.open('The server is not available, try again later');
      }
    );
  }

  private async receiveMessages(message) {
    switch (message.type) {
      case Event.CHANNELJOINED:
      {
        // clear history
        this.messages = [];
        this.messages.push(new Message(new User(SAFERCHAT), WELCOMEMESSAGE));
        message.data.peers.map(async peer => {

          const publicKey = await this.cryptoService.decodeBase64PublicKey(peer.key);
          const user: User = new User(peer.name, publicKey, peer.key);
          this.peers.push(user);
          this.messages.push({ from: user, action: Action.JOINED });
        });

        break;
      }
      case Event.PEERJOINED:
      {
        const publicKey = await this.cryptoService.decodeBase64PublicKey(message.data.who.key);
        const newPeer: User = new User(message.data.who.name, publicKey, message.data.who.key);
        this.peers.push(newPeer);
        this.messages.push({ from: newPeer, action: Action.JOINED });
        this.sendBrowserNotification(newPeer.name, Event.PEERJOINED);
        break;
      }
      case Event.MESSAGERECEIVED:
      {
        const messageDecrypted = await this.cryptoService.decrypt(message.data.message);
        const fromUser: User = this.peers.find(peer => peer.name === message.data.from.name);
        this.messages.push(new Message(fromUser, messageDecrypted));
        this.sendBrowserNotification(fromUser.name, Event.MESSAGERECEIVED);
        break;
      }
      case Event.PEERLEFT:
      {
        const userLeft: User = this.peers.find(peer => peer.name === message.data.who.name);
        const index: number = this.peers.findIndex(peer => peer.name === message.data.who.name);
        this.messages.push({from: userLeft, action: Action.LEFT});
        this.peers.splice(index, 1);
        this.sendBrowserNotification(userLeft.name, Event.PEERLEFT);
        break;
      }
      case Event.COMMANDREJECTED:
      {
        this.snackBar.open(message.data.reason, 'OK', {duration: 10000});
        this.defaultDialogUserParams.data.nickname = this.user.name;
        this.defaultDialogUserParams.data.channel = this.channel.name;
        this.defaultDialogUserParams.data.secret = this.channel.secret;
        this.openUserPopup(this.defaultDialogUserParams);
      }
    }
  }

  private sendEmptyMessage(chatService: ChatService) {
    this.chat.connect();
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

  public sendMessage(messageContent) {
    let message: any;

    if (!messageContent) {
      return;
    }

    this.peers.forEach(peer => {
      this
        .cryptoService
        .encrypt(messageContent, peer.publicKey)
        .then(encryptedMessage => {
          message = {
            type: Action.SENDMESSAGE,
            data: {
              to: peer.name,
              message: encryptedMessage
            }
          };
          this.chat.send(message);
        });
    });
    this.messages.push(new Message(this.user, messageContent));
    this.messageContent = '';
  }

  private sendNotification(params: any, action: Action): void {
    let message: any;
    message = {
      type : Action.JOINED,
      data : {
        channel : this.channel.name,
        secret : this.channel.sha256Secret,
        name : {
          name : this.user.name,
          key: this.user.base64EncodedPublicKey
        }
      }
    };

    this.chat.send(message);
  }

  private leaveChannel() {
    const message =  { type: Action.LEFT };
    this.chat.send(message);
  }

  public onClickUserInfo() {
    this.openUserPopup({
      data: {
        nickname: this.user.name,
        title: 'Edit Details',
        dialogType: DialogUserType.EDIT,
        channel: this.channel.name,
        secret: this.channel.secret
      }
    });
  }

  private openUserPopup(params): void {
    this.dialogRef = this.dialog.open(DialogUserComponent, params);
    this.dialogRef.afterClosed().subscribe(async paramsDialog => {
      if (!paramsDialog) {
        return;
      }

      this.user = new User(
        paramsDialog.username,
        this.cryptoService.getPublicKey(),
        this.cryptoService.getBase64PublicKey());

      this.channel = new Channel(
        paramsDialog.channel,
        paramsDialog.secret);

      this.channel.sha256Secret = await this.cryptoService.sha256(paramsDialog.secret);
      // send notification to appComponent
      this.chat.setChannnelName(this.channel.name);

      if (paramsDialog.dialogType === DialogUserType.NEW) {
        this.sendNotification(paramsDialog, Action.JOINED);
      } else if (paramsDialog.dialogType === DialogUserType.EDIT) {
        this.leaveChannel();
        this.sendNotification(paramsDialog, Action.RENAME);
      }
    });
  }

  private sendBrowserNotification (user: string, type: string) {
    let notificationMsj;

    switch (type) {
      case Event.MESSAGERECEIVED : {
        notificationMsj = `New message from ${user}`;
        break;
      }
      case Event.PEERJOINED: {
        notificationMsj = `${user} joined the channel`;
        break;
      }
      case Event.PEERLEFT: {
        notificationMsj = `${user} left the channel`;
        break;
      }
    }

    if (!('Notification' in window)) {
      return;
    } else if (Notification.permission === 'granted') {
      const notification = new Notification(notificationMsj);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          const notification = new Notification(notificationMsj);
        }
      });
    }
  }
}
