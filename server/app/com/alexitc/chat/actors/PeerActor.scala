package com.alexitc.chat.actors

import akka.actor.{Actor, ActorRef, Props}
import com.alexitc.chat.models.{Channel, Message, Peer}

class PeerActor(client: ActorRef, channelHandler: ChannelHandlerActor.Ref) extends Actor {

  import PeerActor._

  private var state: State = State.Idle

  private def leaveCurrentChannel(): Unit = {
    withOnChannelState { s =>
      channelHandler.actor ! ChannelHandlerActor.Command.LeaveChannel(s.channel.name)
      state = State.Idle
    }
  }

  override def postStop(): Unit = {
    leaveCurrentChannel()
  }

  override def receive: Receive = {
    case Command.JoinChannel(channelName, name) =>
      leaveCurrentChannel()
      channelHandler.actor ! ChannelHandlerActor.Command.JoinChannel(channelName, name)

    case Command.SendMessage(to, message) =>
      withOnChannelState { s =>
        val peerMaybe = s.channel.peers.find(_.name == to)
        peerMaybe.foreach { peer =>
          peer.ref ! Event.MessageReceived(s.me, message)
        }
      }

    case msg: Event => client ! msg
    case msg: ChannelHandlerActor.Event => handleChannelHandlerResponse(msg)
    case x => println(s"Unexpected message: $x")
  }

  def handleChannelHandlerResponse(event: ChannelHandlerActor.Event): Unit = event match {
    case ChannelHandlerActor.Event.ChannelJoined(channel, who) =>
      state = State.OnChannel(who, channel)
      val peers: Set[Peer] = channel.peers.collect { case p: Peer => p }
      client ! Event.ChannelJoined(channel.name, peers)

    case ChannelHandlerActor.Event.PeerJoined(who) =>
      withOnChannelState { s =>
        state = s.add(who)
        client ! Event.PeerJoined(who)
      }

    case ChannelHandlerActor.Event.PeerLeft(who) =>
      withOnChannelState { s =>
        state = s.remove(who.name)
        client ! Event.PeerLeft(who)
      }

    case ChannelHandlerActor.Event.PeerRejected(reason) =>
      client ! Event.CommandRejected(reason)
  }

  private def withOnChannelState(f: State.OnChannel => Unit): Unit = {
    state match {
      case state: State.OnChannel => f(state)
      case _ => ()
    }
  }
}

object PeerActor {

  def props(client: ActorRef, channelHandler: ChannelHandlerActor.Ref) = Props(new PeerActor(client, channelHandler))

  sealed trait State
  object State {
    final case object Idle extends State
    final case class OnChannel(me: Peer, channel: Channel) extends State {
      def add(peer: Peer.HasRef): OnChannel = OnChannel(
        me,
        channel.copy(peers = channel.peers + peer))

      def remove(name: Peer.Name): OnChannel = OnChannel(
        me,
        channel.copy(peers = channel.peers.filter(_.name != name)))
    }
  }

  sealed trait Command extends Product with Serializable
  object Command {

    final case class JoinChannel(channel: Channel.Name, name: Peer) extends Command
    final case class SendMessage(to: Peer.Name, message: Message) extends Command
  }

  sealed trait Event extends Product with Serializable
  object Event {
    final case class ChannelJoined(channel: Channel.Name, peers: Set[Peer]) extends Event
    final case class PeerJoined(who: Peer) extends Event
    final case class PeerLeft(who: Peer) extends Event
    final case class MessageReceived(from: Peer, message: Message) extends Event
    final case class CommandRejected(reason: String) extends Event
  }
}
