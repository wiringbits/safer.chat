package controllers

import akka.actor.ActorSystem
import akka.stream.Materializer
import com.alexitc.chat.actors.PeerActor.{Command, Event}
import com.alexitc.chat.actors.{ChannelHandlerActor, PeerActor}
import com.alexitc.chat.models._
import controllers.codecs.CommonCodecs
import javax.inject.{Inject, Singleton}
import play.api.libs.json._
import play.api.libs.streams.ActorFlow
import play.api.mvc.{AbstractController, ControllerComponents, WebSocket}

@Singleton
class ChannelsController @Inject() (cc: ControllerComponents)(implicit system: ActorSystem, mat: Materializer) extends AbstractController(cc) {

  import ChannelsController._

  private val channelConfig = ChannelHandlerActor.Config(
    maxPeersOnChannel = 4,
    supportEmail = "chat@wiringbits.net"
  )

  private val channelHandler: ChannelHandlerActor.Ref = ChannelHandlerActor.Ref(
    system.actorOf(ChannelHandlerActor.props(channelConfig), "channel-handler")
  )

  def ws() = WebSocket.accept[JsValue, PeerActor.Event] { _ =>
    ActorFlow.actorRef { client =>
      PeerActor.props(client, channelHandler)
    }
  }
}

object ChannelsController extends CommonCodecs {

  private implicit val base64StringFormat: Format[Base64String] = safeWrapperFormat[Base64String, String](Base64String.from, _.string)
  private implicit val messageFormat: Format[Message] = wrapperFormat[Message, String](Message.from, _.base64.string)
  private implicit val peerNameFormat: Format[Peer.Name] = safeWrapperFormat[Peer.Name, String](Peer.Name.from, _.string)

  private implicit val peerKeyFormat: Format[Peer.Key] = new Format[Peer.Key] {
    override def reads(json: JsValue): JsResult[Peer.Key] = {
      json
          .validate[Base64String]
          .flatMap { hex =>
            Peer.Key.from(hex)
                .map(JsSuccess(_))
                .getOrElse(JsError("Invalid public key"))
          }
    }

    override def writes(o: Peer.Key): JsValue = {
      Json.toJson(o.encoded)
    }
  }

  private implicit val channelNameFormat: Format[Channel.Name] = safeWrapperFormat[Channel.Name, String](Channel.Name.from, _.string)
  private implicit val channelSecretFormat: Format[Channel.Secret] = wrapperFormat[Channel.Secret, String](Channel.Secret.apply, _.string)

  private implicit val peerFormat: Format[Peer] = new Format[Peer] {
    override def reads(json: JsValue): JsResult[Peer] = {
      for {
        name <- (json \ "name").validate[Peer.Name]
        key <- (json \ "key").validate[Peer.Key]
      } yield Peer.Simple(name, key)
    }

    override def writes(o: Peer): JsValue = {
      Json.obj(
        "name" -> o.name,
        "key" -> o.key
      )
    }
  }

  private val joinChannelReads: Reads[Command.JoinChannel] = Json.reads[Command.JoinChannel]
  private val sendMessageReads: Reads[Command.SendMessage] = Json.reads[Command.SendMessage]

  implicit val reads: Reads[Command] = (json: JsValue) => {
    val result = for {
      tpe <- (json \ "type").validate[String]
    } yield tpe match {
      case "joinChannel" => (json \ "data").validate[Command.JoinChannel](joinChannelReads)
      case "leaveChannel" => JsSuccess(Command.LeaveChannel)
      case "sendMessage" => (json \ "data").validate[Command.SendMessage](sendMessageReads)
    }

    result.flatMap(identity)
  }

  implicit val joinChannelWrites: Writes[Command.JoinChannel] = Json.writes[Command.JoinChannel]
  implicit val sendMessageWrites: Writes[Command.SendMessage] = Json.writes[Command.SendMessage]
  implicit val commandWrites: Writes[Command] = {
    case obj: Command.JoinChannel =>
      Json.obj(
        "type" -> "joinChannel",
        "data" -> Json.toJson(obj)(joinChannelWrites)
      )

    case obj: Command.SendMessage =>
      Json.obj(
        "type" -> "sendMessage",
        "data" -> Json.toJson(obj)(sendMessageWrites)
      )

    case Command.LeaveChannel =>
      Json.obj(
        "type" -> "leaveChannel"
      )

  }

  private val channelJoinedWrites: Writes[Event.ChannelJoined] = Json.writes[Event.ChannelJoined]
  private val peerJoinedWrites: Writes[Event.PeerJoined] = Json.writes[Event.PeerJoined]
  private val peerLeftWrites: Writes[Event.PeerLeft] = Json.writes[Event.PeerLeft]
  private val messageReceivedWrites: Writes[Event.MessageReceived] = Json.writes[Event.MessageReceived]
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

    case obj: Event.MessageReceived =>
      Json.obj(
        "type" -> "messageReceived",
        "data" -> Json.toJson(obj)(messageReceivedWrites)
      )

    case obj: Event.CommandRejected =>
      Json.obj(
        "type" -> "commandRejected",
        "data" -> Json.toJson(obj)(commandRejectedWrites)
      )
  }

  implicit val transformer: WebSocket.MessageFlowTransformer[JsValue, Event] = {
    WebSocket.MessageFlowTransformer.jsonMessageFlowTransformer[JsValue, Event]
  }
}