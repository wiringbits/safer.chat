import { Component, OnInit, AfterViewInit, Input} from '@angular/core';
import { fromEvent } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ChatService } from 'src/app/services/chat.service';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { User, Event, Room } from '../../models';
import { CryptoService } from 'src/app/services/crypto.service';
import { Router } from '@angular/router';
import { BlockUI, NgBlockUI } from 'ng-block-ui';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  @BlockUI() blockUI: NgBlockUI;

  scrolled = false;
  userFormControl: FormGroup;
  user: User;
  room: Room;
  peers: User[] = [];
  errorMessages: MatSnackBarRef<SimpleSnackBar>;

  constructor(private chatService: ChatService,
              private snackBar: MatSnackBar,
              private cryptoService: CryptoService,
              private router: Router) {}

  ngOnInit(): void {
    this.userFormControl = this.createFormGroup();
    this.initIoConnection();
    this.room = this.chatService.getRoom();
    if (this.room !== undefined) {
      this.userFormControl.get('room').setValue( this.room.name);
    }
  }

  ngAfterViewInit(): void {
    // when scrolled,this event is fired
    fromEvent(document, 'scroll').subscribe(event => {
      this.scrolled = document.scrollingElement.scrollTop > 10;
    });
  }

  private initIoConnection(): void {
    this.chatService.connect();

    this.chatService.messages.subscribe(
      message => { this.receiveMessages(message); },
      error   => { this.manageErrors(error); },
      ()      => { this.reconnectSocket(); }
    );
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      nickname: new FormControl('', [Validators.required,
        Validators.pattern('(^[^- ])([a-z0-9 _ -]{1,18})([^- ])$')]),
      room: new FormControl('', [Validators.required,
        Validators.pattern('(^[^- ])([a-z0-9 _ -.]{1,18})([^- ])$')]),
      secret: new FormControl('', Validators.required)
    });
  }

  private async receiveMessages(message) {
    this.snackBar.dismiss();
    this.blockUI.stop();
    switch (message.type) {
      case Event.CHANNELJOINED:
      {
        this.chatService.setRoom(this.room);
        this.chatService.setUser(this.user);
        let id = 2;
        message.data.peers.forEach(async peer => {
          const publicKey = await this.cryptoService.decodeBase64PublicKey(peer.key);
          const user: User = new User(peer.name, id++, publicKey, peer.key);
          this.peers.push(user);
        });
        this.chatService.setInitialPeers(this.peers);
        this.router.navigateByUrl(`/${this.room.name}`);
        break;
      }
      case Event.COMMAND_REJECTED:
      {
        this.snackBar.open(message.data.reason, 'OK', {duration: 10000});
      }
    }
  }

  private manageErrors(error) {
    this.snackBar.open('The server is not available, try again later');
    this.reconnectSocket();
  }

  private reconnectSocket() {
    setTimeout(() => this.initIoConnection(), 1000);
  }

  public async onJoin() {
    if (this.userFormControl.invalid) {
      return;
    }
    this.blockUI.start();
    this.user = new User(
      this.userFormControl.get('nickname').value,
      1,
      this.cryptoService.getPublicKey(),
      this.cryptoService.getBase64PublicKey());

    this.room = new Room(
      this.userFormControl.get('room').value,
      this.userFormControl.get('secret').value);

    this.room.sha256Secret = await this.cryptoService.sha256(this.room.secret);
    this.chatService.JoinRoom(this.user, this.room);
  }
}
