import { Component, OnInit, AfterViewInit} from '@angular/core';
import { fromEvent } from 'rxjs';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ChatService } from 'src/app/services/chat.service';
import { MatSnackBar } from '@angular/material';
import { Action, User, Message, Event, DialogUserType, Channel } from '../../models';
import { CryptoService } from 'src/app/services/crypto.service';
import { RouterModule, Routes, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  scrolled = false;
  userFormControl: FormGroup;
  user: User;
  channel: Channel;
  peers: User[] = [];

  constructor(private chatService: ChatService,
              private snackBar: MatSnackBar,
              private cryptoService: CryptoService,
              private router: Router) {}

  ngOnInit(): void {
    this.userFormControl = this.createFormGroup();
    this.initIoConnection();
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
      message => {
        this.receiveMessages(message);
      },
      error => {
        this.snackBar.open('The server is not available, try again later');
      }, () => {
        console.log('disconected');
      }
    );
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      nickname: new FormControl('', [Validators.required,
        Validators.pattern('(^[^- ])([a-z0-9 _ -]{1,18})([^- ])$')]),
      channel: new FormControl('', [Validators.required,
        Validators.pattern('(^[^- ])([a-z0-9 _ -.]{1,18})([^- ])$')]),
      secret: new FormControl('', Validators.required)
    });
  }

  public async onJoin() {
    if (this.userFormControl.invalid) {
      return;
    }

    this.user = new User(
      this.userFormControl.get('nickname').value,
      this.cryptoService.getPublicKey(),
      this.cryptoService.getBase64PublicKey());

    this.channel = new Channel(
      this.userFormControl.get('channel').value,
      this.userFormControl.get('secret').value);

    this.channel.sha256Secret = await this.cryptoService.sha256(this.channel.secret);

    this.JoinChannel();
  }

  private async receiveMessages(message) {
    switch (message.type) {
      case Event.CHANNELJOINED:
      {
        this.chatService.setChannnel(this.channel);
        this.chatService.setUser(this.user);
        message.data.peers.forEach(async peer => {
          const publicKey = await this.cryptoService.decodeBase64PublicKey(peer.key);
          const user: User = new User(peer.name, publicKey, peer.key);
          this.peers.push(user);
        });
        this.chatService.setInitialPeers(this.peers);
        this.router.navigateByUrl(`/${this.channel.name}`);
        break;
      }
      case Event.COMMAND_REJECTED:
      {
        this.snackBar.open(message.data.reason, 'OK', {duration: 10000});
      }
    }
  }

  private JoinChannel(): void {
    let message: any;
    message = {
      type : Action.JOIN,
      data : {
        channel : this.channel.name,
        secret : this.channel.sha256Secret,
        name : {
          name : this.user.name,
          key: this.user.base64EncodedPublicKey
        }
      }
    };

    this.chatService.send(message);
  }

}
