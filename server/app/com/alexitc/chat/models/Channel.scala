package com.alexitc.chat.models

import akka.actor.ActorRef

case class Channel(participants: Set[Peer]) {

  def contains(peer: Peer): Boolean = {
    participants.exists { that =>
      that.ref == peer.ref ||
      that.name == peer.name
    }
  }

  def join(who: Peer): Channel = {
    Channel(participants + who)
  }

  def leave(who: Peer): Channel = {
    Channel(participants - who)
  }
}

object Channel {

  val empty: Channel = Channel(Set.empty)
}

case class Peer(name: String, ref: ActorRef)
