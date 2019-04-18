package com.alexitc.chat.models

/**
 * A peer can join a channel only if he knows the name and the secret.
 */
case class Channel(
    name: Channel.Name,
    secret: Channel.Secret,
    peers: Set[Peer.HasRef]) {

  def contains(peer: Peer.HasRef): Boolean = {
    peers.exists { that =>
      that.ref == peer.ref ||
      that.name == peer.name
    }
  }

  def join(who: Peer.HasRef): Channel = {
    copy(peers = peers + who)
  }

  def leave(who: Peer.HasRef): Channel = {
    copy(peers = peers - who)
  }
}

object Channel {

  def empty(name: Name, secret: Secret): Channel = Channel(name, secret, Set.empty)

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

  // TODO: A secret must match a regex
  case class Secret(string: String) extends AnyVal {
    override def toString: String = "SECRET"
  }
}
