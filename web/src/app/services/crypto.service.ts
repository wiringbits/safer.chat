import { Injectable } from '@angular/core';

import { fromByteArray, toByteArray, byteLength } from 'base64-js';

@Injectable()
export class CryptoService {

  private encryptionKeys: CryptoKeyPair;
  private publicKey: any ;

  constructor() {
    this.generateEncryptionKeys();

  }

  encrypt(text: string): PromiseLike<string> {
    const data = new TextEncoder().encode(text);
    return window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      this.encryptionKeys.publicKey,
      data
    ).then( (encrypted) => {
      const encoded = fromByteArray(new Uint8Array(encrypted));
      return encoded;
    });
  }


  encrypt2(text: string, cryptoKey: CryptoKey ): PromiseLike<string> {
    const data = new TextEncoder().encode(text);
    return window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      cryptoKey,
      data
    ).then( (encrypted) => {
      const encoded = fromByteArray(new Uint8Array(encrypted));
      return encoded;
    });
  }

  decrypt(encoded: string): PromiseLike<string> {
    const params = {
      name: 'RSA-OAEP'
    };

    return window.crypto.subtle.decrypt(params, this.encryptionKeys.privateKey, toByteArray(encoded))
      .then( (decrypted) => {
        const text = new TextDecoder('utf-8').decode(decrypted);
        return text;
      });
  }

  private exportPublicKey () {
    window.crypto.subtle.exportKey('spki', this.encryptionKeys.publicKey)
    .then((exported) => {
      this.publicKey =  Array.prototype.map.call(new Uint8Array(exported), x => ('00' + x.toString(16)).slice(-2)).join('');
      // this.importPublicKey(this.publicKey).then(data => {
      //   console.log(data)
      // });
    });
  }

  private str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  public importPublicKey (data: string) {

    const binaryDerString = window.atob(data);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = this.str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );

//     const encryptAlgorithm = {
//       name: 'RSA-OAEP',
//       hash: 'SHA-256'
//     };

// console.log(encryptAlgorithm)
// const array = toByteArray(data);
// console.log(array)
//     return window.crypto.subtle.importKey('spki', array, encryptAlgorithm , true, ['encrypt']);
  }

  public getPublicKey() {
    return this.publicKey;
  }

  private generateEncryptionKeys() {
    const params = {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: { name: 'SHA-256' },
    };

    window.crypto.subtle.generateKey(params, false, ['encrypt', 'decrypt'])
      .then((keyPair) =>  {
        this.encryptionKeys = keyPair;
        this.exportPublicKey();
      });
  }
}
