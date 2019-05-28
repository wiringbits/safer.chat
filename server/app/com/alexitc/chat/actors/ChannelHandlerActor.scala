package com.alexitc.chat.actors

import akka.actor.{Actor, ActorLogging, ActorRef, Props}
import com.alexitc.chat.models.{Channel, Peer}

class ChannelHandlerActor(config: ChannelHandlerActor.Config) extends Actor with ActorLogging {

  import ChannelHandlerActor._

  override def preStart(): Unit = {
    context become withChannelsState(Map.empty)
  }

  override def receive: Receive = {
    case msg => log.warning(s"receive - unexpected message: $msg")
  }

  private var totalPeers = 0
  private var activePeers = 0
  private var exceededTries = 0

  private def withChannelsState(channels: State): Receive = {
    case Command.JoinChannel(name, secret, peer) =>
      val who = peer.withRef(sender())
      val channel = channels.getOrElse(name, Channel.empty(name, secret))
      if (channel.peers.size >= config.maxPeersOnChannel) {
        exceededTries = exceededTries + 1
        log.info(s"Rejecting peer due to channel full, failed $exceededTries times")
        who.ref ! Event.PeerRejected(s"The room is full, if you need bigger rooms, write us to ${config.supportEmail}")
      } else if (channel.secret == secret) {
        for {
          newState <- joinChannelUnsafe(channels, who, channel)
        } {
          totalPeers = totalPeers + 1
          activePeers = activePeers + 1
          log.info(s"ActivePeers = $activePeers, TotalPeers = $totalPeers, ActiveChannels = ${channels.size}")
          context become withChannelsState(newState)
        }
      } else {
        who.ref ! Event.PeerRejected("The secret or the room is incorrect")
      }

    // a peer can belong to a single channel, find where it is and remove it
    case Command.LeaveChannel =>
      val whoRef = sender()
      for {
        channel <- channels.values
        who <- channel.peers.find(_.ref == whoRef)
      } {
        activePeers = activePeers - 1
        val newState = leaveChannelUnsafe(channels, who, channel)
        context become withChannelsState(newState)
      }
  }

  private def leaveChannelUnsafe(channels: State, who: Peer.HasRef, channel: Channel): State = {
    log.info(s"${who.name} is leaving ${channel.name}")

    // is important to notify the peer that is leaving
    notifyPeerLeft(channel, who)

    val newChannel = channel.leave(who)
    if (newChannel.isEmpty) {
      channels - channel.name
    } else {
      channels.updated(channel.name, newChannel)
    }
  }

  private def joinChannelUnsafe(channels: State, who: Peer.HasRef, channel: Channel): Option[State] = {
    log.info(s"a peer with name=${who.name} is trying to join room=${channel.name}")
    joinChannel(who, channel) match {
      case Left(rejectionEvent) =>
        log.info(s"rejecting command, name=${who.name}, reason = ${rejectionEvent.reason}")
        who.ref ! rejectionEvent
        None

      case Right(newChannel) =>
        log.info(s"${who.name} has joined ${channel.name}")
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
