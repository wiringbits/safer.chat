package com.alexitc.chat.actors

import akka.actor.{Actor, ActorRef, Props}
import com.alexitc.chat.models.{Channel, Peer}

class ChannelHandlerActor extends Actor {

  import ChannelHandlerActor._

  private var channels: Map[Channel.Name, Channel] = Map.empty

  override def receive: Receive = {
    case Command.JoinChannel(name, secret, peer) =>
      val who = peer.withRef(sender())
      val channel = getOrCreate(name, secret)
      if (channel.secret == secret) {
        joinChannel(who, channel)
      } else {
        who.ref ! Event.PeerRejected("The secret or the channel is incorrect")
      }

    case Command.LeaveChannel(channelName) =>
      val whoRef = sender()
      for {
        channel <- get(channelName)
        who <- channel.peers.find(_.ref == whoRef)
      } {
        leaveChannel(who, channel)
      }
  }

  private def get(name: Channel.Name): Option[Channel] = {
    channels.get(name)
  }

  private def getOrCreate(name: Channel.Name, secret: Channel.Secret): Channel = {
    channels.getOrElse(name, Channel.empty(name, secret))
  }

  private def update(channel: Channel): Unit = {
    channels = channels.updated(channel.name, channel)
  }

  private def notifyPeerJoined(channel: Channel, who: Peer.HasRef): Unit = {
    val event = Event.PeerJoined(who)
    notify(channel, who, event)
  }

  private def notifyPeerLeft(channel: Channel, who: Peer): Unit = {
    val event = Event.PeerLeft(who)
    notify(channel, who, event)
  }

  private def notify(channel: Channel, who: Peer, event: Event): Unit = {
    channel
        .peers
        .filter(_.name != who.name)
        .foreach(_.ref ! event)
  }

  private def joinChannel(who: Peer.HasRef, channel: Channel): Unit = {
    println(s"a peer with name=${who.name} is trying to join channel=${channel.name}")

    if (channel.contains(who)) {
      println(s"rejecting command, name=${who.name} already taken on channel=${channel.name}")

      who.ref ! Event.PeerRejected("The name is already taken")
    } else {
      println(s"${who.name} has joined ${channel.name}")

      val newChannel = channel.join(who)
      update(newChannel)
      notifyPeerJoined(channel, who)

      who.ref ! Event.ChannelJoined(channel, who)
    }
  }

  private def leaveChannel(who: Peer.HasRef, channel: Channel): Unit = {
    println(s"${who.name} is leaving ${channel.name}")

    val newChannel = channel.leave(who)
    update(newChannel)
    notifyPeerLeft(channel, who)
  }
}

object ChannelHandlerActor {

  def props: Props = Props(new ChannelHandlerActor)

  case class Ref(actor: ActorRef) extends AnyVal

  sealed trait Command extends Product with Serializable
  object Command {
    final case class JoinChannel(channel: Channel.Name, secret: Channel.Secret, who: Peer) extends Command
    final case class LeaveChannel(channel: Channel.Name) extends Command
  }

  sealed trait Event extends Product with Serializable
  object Event {
    final case class ChannelJoined(channel: Channel, who: Peer) extends Event
    final case class PeerJoined(peer: Peer.HasRef) extends Event
    final case class PeerLeft(peer: Peer) extends Event
    final case class PeerRejected(reason: String) extends Event
  }
}
