import { environment } from '../environments/environment';
// Actions you can take on the App
export enum Action {
  JOIN = 'joinChannel',
  RENAME = 'renameChannel',
  LEFT = 'leaveChannel',
  SENDMESSAGE = 'sendMessage'
}

// Socket events
export enum Event {
  CHANNELJOINED = 'channelJoined',
  PEER_JOINED = 'peerJoined',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE_RECEIVED = 'messageReceived',
  PEER_LEFT = 'peerLeft',
  COMMAND_REJECTED = 'commandRejected'
}

export enum DialogUserType {
  NEW,
  EDIT
}

export class User {
  avatar: string;

  constructor(
    public name: string,
    public id: number,
    public publicKey?: CryptoKey,
    public base64EncodedPublicKey?: string) {
      this.name = name;
      this.avatar = `../../../assets/avatar/man${this.id}.png`;
  }
}

export class Message {
  from: User;
  type: string;
  content?: string;
  constructor(from: User, action: string, content?: string) {
    this.from = from;
    this.type = action;
    this.content = content;
  }
}

export class Room {
  sha256Secret?: string;
  constructor (public name: string, public secret: string) {
    this.name = name;
    this.secret = secret;
  }
}


export class DialogParams {
  public disableClose: boolean;
  public data: {
    user: User,
    room: Room,
    title: string
  };
  constructor (public user: User, public room: Room, disableClose: boolean) {
    this.data.user = user;
    this.data.room = room;
    this.disableClose = disableClose;
  }
}
