package com.alexitc.chat.actors

import akka.actor.{Actor, ActorRef, Props}
import com.alexitc.chat.models.{Channel, Message, Peer}

class PeerActor(client: ActorRef, channelHandler: ChannelHandlerActor.Ref) extends Actor {

  import PeerActor._

  private var state: State = State.Idle

  private def leaveCurrentChannel(): Unit = {
    state match {
      case State.OnChannel(_, channel) =>
        channelHandler.actor ! ChannelHandlerActor.Command.LeaveChannel(channel.name)
        state = State.Idle

      case _ => ()
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
      state match {
        case s: State.OnChannel =>
          val peerMaybe = s.channel.peers.find(_.name == to)
          peerMaybe.foreach { peer =>
            peer.ref ! Event.MessageReceived(s.me, message)
          }

        case _ => ()
      }

    case msg: Event => client ! msg
    case msg: ChannelHandlerActor.Event => handleChannelHandlerResponse(msg)
    case x => println(s"Unexpected message: $x")
  }

  def handleChannelHandlerResponse(event: ChannelHandlerActor.Event): Unit = event match {
    case ChannelHandlerActor.Event.ChannelJoined(channel, who) =>
      state = State.OnChannel(who, channel)
      client ! Event.ChannelJoined(channel.name, channel.peers.map(_.name))

    case ChannelHandlerActor.Event.PeerJoined(who) =>
      state match {
        case x: State.OnChannel =>
          state = x.add(who)
          client ! Event.PeerJoined(who.name)

        case _ => ()
      }

    case ChannelHandlerActor.Event.PeerLeft(who) =>
      state match {
        case x: State.OnChannel =>
          state = x.remove(who)
          client ! Event.PeerLeft(who.name)

        case _ => ()
      }

    case ChannelHandlerActor.Event.PeerRejected(reason) =>
      client ! Event.CommandRejected(reason)
  }
}

object PeerActor {

  def props(client: ActorRef, channelHandler: ChannelHandlerActor.Ref) = Props(new PeerActor(client, channelHandler))

  sealed trait State
  object State {
    final case object Idle extends State
    final case class OnChannel(me: Peer.Name, channel: Channel) extends State {
      def add(peer: Peer): OnChannel = OnChannel(
        me,
        channel.copy(peers = channel.peers + peer))

      def remove(peer: Peer): OnChannel = OnChannel(
        me,
        channel.copy(peers = channel.peers - peer))
    }
  }

  sealed trait Command extends Product with Serializable
  object Command {

    final case class JoinChannel(channel: Channel.Name, name: Peer.Name) extends Command
    final case class SendMessage(to: Peer.Name, message: Message) extends Command
  }

  sealed trait Event extends Product with Serializable
  object Event {
    final case class ChannelJoined(channel: Channel.Name, peers: Set[Peer.Name]) extends Event
    final case class PeerJoined(who: Peer.Name) extends Event
    final case class PeerLeft(who: Peer.Name) extends Event
    final case class MessageReceived(from: Peer.Name, message: Message) extends Event
    final case class CommandRejected(reason: String) extends Event
  }
}
