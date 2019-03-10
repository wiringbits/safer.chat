package com.alexitc.chat.actors

import akka.actor.{Actor, ActorRef, Props}
import com.alexitc.chat.models.{Channel, Peer}

class ChannelHandlerActor extends Actor {

  import ChannelHandlerActor._

  private var channels: Map[String, Channel] = Map.empty

  override def receive: Receive = {
    case Command.JoinChannel(channelName, name) =>
      println(s"a peer with name=$name is trying to join channel=$channelName")

      val who = Peer(name, sender())
      val channel = getOrCreate(channelName)
      if (channel.contains(who)) {
        println(s"rejecting command, name=$name already taken on channel=$channelName")
        who.ref ! Event.PeerRejected("The name is already taken")
      } else {
        println(s"$name has joined $channelName")
        val newChannel = channel.join(who)

        update(channelName, newChannel)
        notifyPeerJoined(channel, who)

        who.ref ! Event.ChannelJoined(channelName, name)
      }

    case Command.LeaveChannel(channelName) =>
      val whoRef = sender()
      val channel = getOrCreate(channelName)
      channel
          .participants
          .find(_.ref == whoRef)
          .foreach { who =>
            println(s"${who.name} is leaving $channelName")

            val newChannel = channel.leave(who)
            update(channelName, newChannel)
            notifyPeerLeft(channel, who)
          }
  }

  private def getOrCreate(channelName: String): Channel = {
    channels.getOrElse(channelName, Channel.empty)
  }

  private def update(channelName: String, channel: Channel): Unit = {
    channels = channels.updated(channelName, channel)
  }

  private def notifyPeerJoined(channel: Channel, who: Peer): Unit = {
    val event = Event.PeerJoined(who)

    channel
        .participants
        .filter(_.name != who.name)
        .foreach(_.ref ! event)
  }

  private def notifyPeerLeft(channel: Channel, who: Peer): Unit = {
    val event = Event.PeerLeft(who)

    channel
        .participants
        .filter(_.name != who.name)
        .foreach(_.ref ! event)
  }
}

object ChannelHandlerActor {

  def props: Props = Props(new ChannelHandlerActor)

  case class Ref(actor: ActorRef) extends AnyVal

  sealed trait Command
  object Command {
    final case class JoinChannel(channelName: String, name: String) extends Command
    final case class LeaveChannel(channelName: String) extends Command
  }

  sealed trait Event
  object Event {
    final case class ChannelJoined(channelName: String, name: String) extends Event
    final case class PeerJoined(peer: Peer) extends Event
    final case class PeerLeft(peer: Peer) extends Event
    final case class PeerRejected(reason: String) extends Event
  }
}
