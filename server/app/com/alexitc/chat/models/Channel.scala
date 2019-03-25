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

  // TODO: A channel name must match a regex
  case class Name(string: String) extends AnyVal {
    override def toString: String = string
  }

  // TODO: A secret must match a regex
  case class Secret(string: String) extends AnyVal {
    override def toString: String = "SECRET"
  }
}
