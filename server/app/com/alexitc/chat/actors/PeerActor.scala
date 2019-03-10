package com.alexitc.chat.actors

import akka.actor.{Actor, ActorRef, Props}
import play.api.libs.json.{JsValue, Json, Reads, Writes}
import play.api.mvc.WebSocket

class PeerActor(client: ActorRef, channelHandler: ChannelHandlerActor.Ref) extends Actor {

  import PeerActor._

  private var state: State = State.Idle

  private def leaveCurrentChannel(): Unit = {
    state match {
      case State.OnChannel(channel, _) =>
        channelHandler.actor ! ChannelHandlerActor.Command.LeaveChannel(channel)
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

    case msg: ChannelHandlerActor.Event =>
      handleChannelHandlerResponse(msg)
  }

  def handleChannelHandlerResponse(event: ChannelHandlerActor.Event): Unit = event match {
    case ChannelHandlerActor.Event.ChannelJoined(channelName, name) =>
      state = State.OnChannel(channelName, name)
      client ! Event.ChannelJoined(channelName)

    case ChannelHandlerActor.Event.PeerJoined(who) =>
      client ! Event.PeerJoined(who.name)

    case ChannelHandlerActor.Event.PeerLeft(who) =>
      client ! Event.PeerLeft(who.name)

    case ChannelHandlerActor.Event.PeerRejected(reason) =>
      client ! Event.CommandRejected(reason)
  }
}

object PeerActor {

  def props(client: ActorRef, channelHandler: ChannelHandlerActor.Ref) = Props(new PeerActor(client, channelHandler))

  sealed trait State
  object State {
    final case object Idle extends State
    final case class OnChannel(channel: String, name: String) extends State
  }

  sealed trait Command
  object Command {

    final case class JoinChannel(channelName: String, name: String) extends Command
  }

  sealed trait Event
  object Event {
    final case class ChannelJoined(channelName: String) extends Event
    final case class PeerJoined(who: String) extends Event
    final case class PeerLeft(who: String) extends Event
    final case class CommandRejected(reason: String) extends Event
  }

  // codecs
  implicit val claimChannelReads: Reads[Command.JoinChannel] = Json.reads[Command.JoinChannel]
  implicit val reads: Reads[Command] = (json: JsValue) => {
    json.validate[Command.JoinChannel]
  }

  private val channelJoinedWrites: Writes[Event.ChannelJoined] = Json.writes[Event.ChannelJoined]
  private val peerJoinedWrites: Writes[Event.PeerJoined] = Json.writes[Event.PeerJoined]
  private val peerLeftWrites: Writes[Event.PeerLeft] = Json.writes[Event.PeerLeft]
  private val commandRejectedWrites: Writes[Event.CommandRejected] = Json.writes[Event.CommandRejected]

  implicit val writes: Writes[Event] = {
    case obj: Event.ChannelJoined =>
      Json.obj(
        "type" -> "channelJoined",
        "data" -> Json.toJson(obj)(channelJoinedWrites))

    case obj: Event.PeerJoined =>
      Json.obj(
        "type" -> "peerJoined",
        "data" -> Json.toJson(obj)(peerJoinedWrites)
      )

    case obj: Event.PeerLeft =>
      Json.obj(
        "type" -> "peerLeft",
        "data" -> Json.toJson(obj)(peerLeftWrites)
      )

    case obj: Event.CommandRejected =>
      Json.obj(
        "type" -> "commandRejected",
        "data" -> Json.toJson(obj)(commandRejectedWrites)
      )
  }

  implicit val transformer: WebSocket.MessageFlowTransformer[Command, Event] = {
    WebSocket.MessageFlowTransformer.jsonMessageFlowTransformer[Command, Event]
  }
}
