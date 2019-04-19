import { Component, OnInit, ViewChildren, ViewChild, AfterViewInit, QueryList, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MatList, MatListItem, MatSnackBar } from '@angular/material';

import { ChatService } from '../../services/chat.service';
import { CryptoService } from '../../services/crypto.service';

import { Action, User, Message, Event, DialogUserType, Channel } from '../../models';
import { DialogUserComponent } from '../dialog-user/dialog-user.component';

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
      name: '',
      channel: '',
      secret: '',
      title: 'Welcome to the safer.chat',
      dialogType: DialogUserType.NEW
    }
  };

  welcomeMessage = `
    Just enter a nickname, a channel name, and a password.
    Then, anyone with the channel and password can join the chat,
    all the messages there are end-to-end encrypted which means that only
    the participants can read them
  `;

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
        this.messages.push(new Message(new User('safer.chat'), this.welcomeMessage));
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
        break;
      }
      case Event.MESSAGERECEIVED:
      {
        const messageDecrypted = await this.cryptoService.decrypt(message.data.message);
        const fromUser: User = this.peers.find(peer => peer.name === message.data.from.name);
        this.messages.push(new Message(fromUser, messageDecrypted));
        break;
      }
      case Event.PEERLEFT:
      {
        const whoUser: User = this.peers.find(peer => peer.name === message.data.who.name);
        const index: number = this.peers.findIndex(peer => peer.name === message.data.who.name);
        this.messages.push({from: whoUser, action: Action.LEFT});
        this.peers.splice(index, 1);
        break;
      }
      case Event.COMMANDREJECTED:
      {
        this.snackBar.open(message.data.reason, 'OK', {duration: 10000});
        this.openUserPopup(this.defaultDialogUserParams);
      }
    }
  }

  private sendEmptyMessage(chatService: ChatService) {
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
        channel : params.channel,
        secret : params.secret,
        name : {
          name : this.user.name,
          key: this.user.base64EncodedPublicKey
        }
      }
    };

    if (action === Action.RENAME) {
      this.leaveChannel();
    }

    this.chat.send(message);
  }

  private leaveChannel() {
    const message =  { type: 'leaveChannel' };
    this.chat.send(message);
  }

  public onClickUserInfo() {
    this.openUserPopup({
      data: {
        username: this.user.name,
        title: 'Edit Details',
        dialogType: DialogUserType.EDIT,
        channel: this.channel.name,
        secret: this.channel.secret
      }
    });
  }

  private openUserPopup(params): void {
    this.dialogRef = this.dialog.open(DialogUserComponent, params);
    this.dialogRef.afterClosed().subscribe(paramsDialog => {
      if (!paramsDialog) {
        return;
      }

      this.user = new User(
        paramsDialog.username,
        this.cryptoService.getPublicKey(),
        this.cryptoService.getBase64PublicKey());

      this.channel = new Channel(paramsDialog.channel, paramsDialog.secret);

      if (paramsDialog.dialogType === DialogUserType.NEW) {
        this.initIoConnection();
        this.sendNotification(paramsDialog, Action.JOINED);
      } else if (paramsDialog.dialogType === DialogUserType.EDIT) {
        this.sendNotification(paramsDialog, Action.RENAME);
      }
    });
  }
}
