package com.alexitc.chat.models

case class Channel(name: Channel.Name, peers: Set[Peer]) {

  def contains(peer: Peer): Boolean = {
    peers.exists { that =>
      that.ref == peer.ref ||
      that.name == peer.name
    }
  }

  def join(who: Peer): Channel = {
    copy(peers = peers + who)
  }

  def leave(who: Peer): Channel = {
    copy(peers = peers - who)
  }
}

object Channel {

  def empty(name: Name): Channel = Channel(name, Set.empty)

  // TODO: A channel name must match a regex
  case class Name(string: String) extends AnyVal {
    override def toString: String = string
  }
}
