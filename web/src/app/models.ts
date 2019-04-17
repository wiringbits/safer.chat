import { environment } from '../environments/environment';
// Actions you can take on the App
export enum Action {
  JOINED = 'joinChannel',
  RENAME = 'renameChannel',
  LEFT = 'leftChannel',
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
  id?: number;
  name?: string;
  avatar?: string;
  key?: string;
  constructor(name: string, key: string = '') {
    this.name = name;
    this.key = key;
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
  consutructor (channelName: string) {
  }
}
