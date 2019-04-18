import { Injectable } from '@angular/core';

import { fromByteArray, toByteArray } from 'base64-js';

const RSA_ALGORITHM_NAME = 'RSA-OAEP';
const RSA_KEY_FORMAT = 'spki';

@Injectable()
export class CryptoService {

  private encryptionKeys: CryptoKeyPair;
  private base64PublicKey: string; // base64

  constructor() {
    this.generateEncryptionKeys();
  }

  getBase64PublicKey(): string {
    return this.base64PublicKey;
  }

  getPublicKey(): CryptoKey {
    return this.encryptionKeys.publicKey;
  }

  decodeBase64PublicKey(base64Encoded: string): PromiseLike<CryptoKey> {
    const params = {
      name: RSA_ALGORITHM_NAME,
      hash: 'SHA-256'
    };

    const bytes = toByteArray(base64Encoded);
    return window
      .crypto
      .subtle
      .importKey(RSA_KEY_FORMAT, bytes, params, true, ['encrypt']
    );
  }

  /**
   * Encrypts the given text with the given public key.
   *
   * @param text the text to encrypt.
   * @param publicKey the key used to encrypt the text.
   * @returns The base64 encoded string representing the encrypted text.
   */
  encrypt(text: string, publicKey: CryptoKey): PromiseLike<string> {
    const data = new TextEncoder().encode(text);
    return window.crypto.subtle.encrypt(
      { name: RSA_ALGORITHM_NAME },
      publicKey,
      data
    ).then( (encrypted) => {
      const encoded = fromByteArray(new Uint8Array(encrypted));
      return encoded;
    });
  }

  /**
   * Decrypt the base64 encoded string with my private key.
   * @param base64Encoded the base64 string to decrypt.
   * @returns the decrypted text.
   */
  decrypt(base64Encoded: string): PromiseLike<string> {
    const params = {
      name: RSA_ALGORITHM_NAME
    };

    const bytes = toByteArray(base64Encoded);
    return window.crypto.subtle.decrypt(params, this.encryptionKeys.privateKey, bytes)
      .then( (decrypted) => {
        const text = new TextDecoder('utf-8').decode(decrypted);
        return text;
      });
  }

  private generateEncryptionKeys() {
    const params = {
      name: RSA_ALGORITHM_NAME,
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    };

    window
      .crypto
      .subtle
      .generateKey(params, true, ['encrypt', 'decrypt'])
      .then(keyPair => this.onEncryptionKeysGenerated(keyPair));
  }

  /**
   * Stores the key pair and the base64 encoded public key.
   */
  private onEncryptionKeysGenerated(encryptionKeys: CryptoKeyPair) {
    this.encryptionKeys = encryptionKeys;
    window
      .crypto
      .subtle
      .exportKey(RSA_KEY_FORMAT, encryptionKeys.publicKey)
      .then(exportedBytes => {
        this.base64PublicKey = fromByteArray(new Uint8Array(exportedBytes));
      });
  }
}
