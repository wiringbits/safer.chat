# safer.chat

https://safer.chat is an end-to-end encrypted web chat that allows to create rooms with up to 4 participants, the idea is to have what cryptocat used to be, without the need to install browser extensions or applications, in 2019 we have the [Web Crypto API](https://www.w3.org/TR/WebCryptoAPI/) which allow us to do all operations.

We do not store any tracking information or history, the server logs doesn't include any keys, nor encrypted messages, in fact, all the server's data lives in-memory.

In order to start a conversation, you need to choose a room and a password, then, only people knowing these details are able to log into that room, this password isn't transferred in plain text.

We hope you enjoy it.


## Technical details

There are two components, the `web` and the `server`, the `web` component is the frontend app that you see at https://safer.chat, it uses the `server` to exchange the keys and the messages with the room participants.

- While joining a room, the app generates a RSA 2048 key-pair and shares the public key with the server (see [Public-key cryptography](https://en.wikipedia.org/wiki/Public-key_cryptography)).
- When a participant joins a room, it gets the participants and their public keys from the server.
- Each time a message is sent, it is encrypted using each participant public key and sent to the server, which knows how to reach the participants.

As you can see by reading the technical details, all messages sent to the server are encrypted, any websocket debugger can be used to verify that the server doesn't alter any encrypted message or keys.

## Development

The project is a monorepository involving the following components:
- The [web](/web) project is the frontend app, what you see at https://safer.chat is what the [web](/web) has, it is built using Angular, communicates to the [server](/server) project using a web socket. 
- The [server](/server) project is what connects the peers, it allows them to exchange their keys and messages, as well as handling the room reservation, it is built with Scala.
- The [infra](/infra) project has the deployment scripts, it uses Ansible.


