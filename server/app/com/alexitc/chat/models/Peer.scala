package com.alexitc.chat.models

import akka.actor.ActorRef

case class Peer(name: Peer.Name, ref: ActorRef)

object Peer {
  // TODO: The name must match a regex
  case class Name(string: String) extends AnyVal {
    override def toString: String = string
  }
}
