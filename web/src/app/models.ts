import { environment } from '../environments/environment';
// Actions you can take on the App
export enum Action {
  JOINED = 'joinChannel',
  RENAME = 'renameChannel',
  LEFT = 'leaveChannel',
  SENDMESSAGE = 'sendMessage'
}

// Socket events
export enum Event {
  CHANNELJOINED = 'channelJoined',
  PEERJOINED = 'peerJoined',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGERECEIVED = 'messageReceived',
  PEERLEFT = 'peerLeft',
  COMMANDREJECTED = 'commandRejected'
}

export enum DialogUserType {
  NEW,
  EDIT
}

export class User {
  id: number;
  avatar: string;

  constructor(
    public name: string,
    public publicKey?: CryptoKey,
    public base64EncodedPublicKey?: string) {

      this.name = name;
      this.id = Math.floor(Math.random() * (1000000)) + 1;
      this.avatar = `${environment.AVATAR_URL}/${this.id}.png`;
  }
}

export class Message {
  from?: User;
  content?: string;
  action: string;
  constructor(from: User, content: string) {
    this.from = from;
    this.content = content;
  }
}

export class ChatMessage extends Message {
  constructor(from: User, content: string) {
    super(from, content);
  }
}

export class Channel {
  sha256Secret?: string;
  constructor (public name: string, public secret: string) {
    this.name = name;
    this.secret = secret;
  }
}
