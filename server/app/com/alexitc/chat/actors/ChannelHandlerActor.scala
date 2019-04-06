package com.alexitc.chat.actors

import akka.actor.{Actor, ActorRef, Props}
import com.alexitc.chat.models.{Channel, Peer}

class ChannelHandlerActor(config: ChannelHandlerActor.Config) extends Actor {

  import ChannelHandlerActor._

  override def preStart(): Unit = {
    context become withChannelsState(Map.empty)
  }

  override def receive: Receive = {
    case msg => println(s"receive - unexpected message: $msg")
  }

  private def withChannelsState(channels: State): Receive = {
    case Command.JoinChannel(name, secret, peer) =>
      val who = peer.withRef(sender())
      val channel = channels.getOrElse(name, Channel.empty(name, secret))
      if (channel.peers.size >= config.maxPeersOnChannel) {
        who.ref ! Event.PeerRejected(s"The channel is full, if you need bigger channels, write us to ${config.supportEmail}")
      } else if (channel.secret == secret) {
        for {
          newState <- joinChannelUnsafe(channels, who, channel)
        } {
          context become withChannelsState(newState)
        }
      } else {
        who.ref ! Event.PeerRejected("The secret or the channel is incorrect")
      }

    // a peer can belong to a single channel, find where it is and remove it
    case Command.LeaveChannel =>
      val whoRef = sender()
      for {
        channel <- channels.values
        who <- channel.peers.find(_.ref == whoRef)
      } {
        val newState = leaveChannelUnsafe(channels, who, channel)
        context become withChannelsState(newState)
      }
  }

  private def leaveChannelUnsafe(channels: State, who: Peer.HasRef, channel: Channel): State = {
    println(s"${who.name} is leaving ${channel.name}")

    // is important to notify the peer that is leaving
    notifyPeerLeft(channel, who)

    val newChannel = channel.leave(who)
    channels.updated(channel.name, newChannel)
  }

  private def joinChannelUnsafe(channels: State, who: Peer.HasRef, channel: Channel): Option[State] = {
    println(s"a peer with name=${who.name} is trying to join channel=${channel.name}")
    joinChannel(who, channel) match {
      case Left(rejectionEvent) =>
        println(s"rejecting command, name=${who.name}, reason = ${rejectionEvent.reason}")
        who.ref ! rejectionEvent
        None

      case Right(newChannel) =>
        println(s"${who.name} has joined ${channel.name}")
        val newState = channels.updated(channel.name, newChannel)
        notifyPeerJoined(channel, who)
        who.ref ! Event.ChannelJoined(channel, who)
        Some(newState)
    }
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

  private def joinChannel(who: Peer.HasRef, channel: Channel): Either[Event.PeerRejected, Channel] = {
    if (channel.contains(who)) {
      Left(Event.PeerRejected("The name is already taken"))
    } else {
      val newChannel = channel.join(who)
      Right(newChannel)
    }
  }
}

object ChannelHandlerActor {

  def props(config: Config): Props = Props(new ChannelHandlerActor(config))

  type State = Map[Channel.Name, Channel]

  case class Ref(actor: ActorRef) extends AnyVal
  case class Config(
      maxPeersOnChannel: Int,
      supportEmail: String
  )

  sealed trait Command extends Product with Serializable
  object Command {
    final case class JoinChannel(channel: Channel.Name, secret: Channel.Secret, who: Peer) extends Command
    final case object LeaveChannel extends Command
  }

  sealed trait Event extends Product with Serializable
  object Event {
    final case class ChannelJoined(channel: Channel, who: Peer) extends Event
    final case class PeerJoined(peer: Peer.HasRef) extends Event
    final case class PeerLeft(peer: Peer) extends Event
    final case class PeerRejected(reason: String) extends Event
  }
}
