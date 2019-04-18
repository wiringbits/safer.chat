package com.alexitc.chat.models

import java.security.PublicKey

import akka.actor.ActorRef

/**
 * While a Peer might have a ref, matching hte name and the key is enough for equality testing.
 */
sealed trait Peer {

  def name: Peer.Name

  def key: Peer.Key

  def withRef(ref: ActorRef): Peer.HasRef = {
    Peer.HasRef(name, key, ref)
  }

  override def equals(obj: Any): Boolean = obj match {
    case that: Peer => name == that.name && key == that.key
    case _ => false
  }

  override def hashCode(): Int = {
    (name, key).hashCode()
  }
}

object Peer {
  class Name private (val string: String) extends AnyVal {
    override def toString: String = string
  }
  object Name {

    private val pattern = "^[a-z0-9_ -]{3,20}$".r.pattern

    def from(string: String): Option[Name] = {
      if (string.trim == string &&
          pattern.matcher(string).matches()) {

        Some(new Name(string))
      } else {
        None
      }
    }
  }


  case class Key(value: PublicKey) {

    lazy val encoded: Base64String = Base64String(value.getEncoded)

    override def equals(obj: Any): Boolean = obj match {
      case that: Key =>
        encoded.string == that.encoded.string

      case _ => false
    }

    override def hashCode(): Int = {
      encoded.string.hashCode
    }

    override def toString: String = encoded.string
  }

  object Key {

    def from(base64: Base64String): Option[Key] = {
      KeyPairs
          .decodePublicKey(base64.bytes)
          .map(Key.apply)
    }
  }

  final case class Simple(
      name: Name,
      key: Key) extends Peer {

    override def hashCode(): Int = super.hashCode()

    override def equals(obj: Any): Boolean = super.equals(obj)
  }

  final case class HasRef(
      name: Name,
      key: Key,
      ref: ActorRef) extends Peer {

    override def hashCode(): Int = super.hashCode()

    override def equals(obj: Any): Boolean = super.equals(obj)
  }
}
