// Actions you can take on the App
export enum Action {
  JOINED = 'joinChannel',
  LEFT = 'leftChannel',
  RENAME = 'renameChannel'
}

// Socket.io events
export enum Event {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect'
}

export enum DialogUserType {
  NEW,
  EDIT
}

export class User {
  id?: number;
  name?: string;
  avatar?: string;
  constructor(name: string) { this.name = name; }
}

export class Message {
  constructor(from: User, content: string) { }
}

export class ChatMessage extends Message {
  constructor(from: User, content: string) {
    super(from, content);
  }
}
