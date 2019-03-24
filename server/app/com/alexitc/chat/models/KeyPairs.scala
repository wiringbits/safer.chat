package com.alexitc.chat.models

import java.security._
import java.security.spec.{PKCS8EncodedKeySpec, X509EncodedKeySpec}

import scala.util.Try

object KeyPairs {

  private val keyFactory = KeyFactory.getInstance("RSA")

  def generate(): KeyPair = {
    val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
    keyPairGenerator.initialize(2048)
    val keyPair = keyPairGenerator.genKeyPair()

    keyPair
  }

  def decodePublicKey(bytes: Array[Byte]): Option[PublicKey] = {
    def unsafe = {
      val publicKeySpec = new X509EncodedKeySpec(bytes)
      keyFactory.generatePublic(publicKeySpec)
    }

    Try(unsafe).toOption
  }

  def decodePrivateKey(bytes: Array[Byte]): Option[PrivateKey] = {
    def unsafe = {
      val privateKeySpec = new PKCS8EncodedKeySpec(bytes)
      keyFactory.generatePrivate(privateKeySpec)
    }

    Try(unsafe).toOption
  }
}
