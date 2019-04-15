package com.alexitc.chat.actors

import akka.actor.{Actor, ActorLogging, ActorRef, Props}
import com.alexitc.chat.models.{Channel, Message, Peer}
import play.api.libs.json.{JsError, JsSuccess, JsValue, Reads}

class PeerActor(
    client: ActorRef,
    channelHandler: ChannelHandlerActor.Ref)(
    implicit commandReads: Reads[PeerActor.Command])
    extends Actor
    with ActorLogging {

  import PeerActor._

  override def preStart(): Unit = {
    context become onIdleState
  }

  override def postStop(): Unit = {
    leaveCurrentChannel()
  }

  private def leaveCurrentChannel(): Unit = {
    channelHandler.actor ! ChannelHandlerActor.Command.LeaveChannel
  }

  /**
   * The Command decoding is done here to be able to report validation issues.
   *
   * It seems that play has no way to do that.
   */
  private def handleJsonMessage(json: JsValue): Unit = {
    json.validate[Command] match {
      case JsSuccess(command, _) =>
        self ! command

      case JsError(errors) =>
        // TODO: Return errors
        log.debug(s"Failed to decode command: ${errors.mkString(", ")}")
    }
  }

  /**
   * When the client connects, it is in the idle state.
   *
   * Then, the client is only able to join a channel.
   */
  private def onIdleState: Receive = {
    case json: JsValue => handleJsonMessage(json)

    // The client is trying to join a channel, the channel manager must confirm that it can join.
    case Command.JoinChannel(channelName, secret, name) =>
      channelHandler.actor ! ChannelHandlerActor.Command.JoinChannel(channelName, secret, name)

    // The channel manager has allowed the client to join the channel
    case ChannelHandlerActor.Event.ChannelJoined(channel, who) =>
      val state = State.OnChannel(who, channel)
      val peers: Set[Peer] = channel.peers.collect { case p: Peer => p }
      client ! Event.ChannelJoined(channel.name, peers)
      context become onChannelState(state)

    // The channel manager isn't allowing the client to join
    case ChannelHandlerActor.Event.PeerRejected(reason) =>
      client ! Event.CommandRejected(reason)

    case msg => log.info(s"onIdleState - unexpected message: $msg")
  }

  /**
   * The client is already participating in a channel.
   */
  private def onChannelState(state: State.OnChannel): Receive = {
    case json: JsValue => handleJsonMessage(json)

    // The client can send a message directly to another peer
    case Command.SendMessage(to, message) =>
      val peerMaybe = state.channel.peers.find(_.name == to)
      peerMaybe.foreach { peer =>
        log.info(s"Send message to ${peer.name}")
        peer.ref ! Event.MessageReceived(state.me, message)
      }

    // The channel manager tells the client that another peer has joined
    case ChannelHandlerActor.Event.PeerJoined(who) =>
      val newState = state.add(who)
      client ! Event.PeerJoined(who)
      context become onChannelState(newState)

    // The channel manager confirms me that I have left the channel
    case ChannelHandlerActor.Event.PeerLeft(who) if who == state.me =>
      client ! Event.PeerLeft(who)
      context become onIdleState

    // The channel manager tells the client that another peer has left
    case ChannelHandlerActor.Event.PeerLeft(who) =>
      val newState = state.remove(who.name)
      client ! Event.PeerLeft(who)
      context become onChannelState(newState)

    // A peer has sent me a message, forward it to the websocket
    case msg: Event.MessageReceived =>
      client ! msg

    //case msg: Event => client ! msg
    case msg => log.info(s"onChannelState - Unexpected message: $msg")
  }

  override def receive: Receive = {
    case x => log.info(s"receive - Unexpected message: $x")
  }
}

object PeerActor {

  def props(
      client: ActorRef,
      channelHandler: ChannelHandlerActor.Ref)(
      implicit reads: Reads[Command]) = {

    Props(new PeerActor(client, channelHandler))
  }

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

    final case class JoinChannel(channel: Channel.Name, secret: Channel.Secret, name: Peer) extends Command
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
