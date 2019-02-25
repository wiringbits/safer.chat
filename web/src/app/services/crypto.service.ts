import { Injectable } from '@angular/core';

import { fromByteArray, toByteArray, byteLength } from 'base64-js';

@Injectable()
export class CryptoService {

  private encryptionKeys: CryptoKeyPair;

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

  private generateEncryptionKeys() {
    const params = {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: { name: 'SHA-256' },
    };

    window.crypto.subtle.generateKey(params, false, ['encrypt', 'decrypt'])
      .then(keyPair => this.encryptionKeys = keyPair);
  }
}
