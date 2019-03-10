package controllers

import akka.actor.ActorSystem
import akka.stream.Materializer
import com.alexitc.chat.actors.{ChannelHandlerActor, PeerActor}
import javax.inject.{Inject, Singleton}
import play.api.libs.streams.ActorFlow
import play.api.mvc.{AbstractController, ControllerComponents, WebSocket}

@Singleton
class ChannelsController @Inject() (cc: ControllerComponents)(implicit system: ActorSystem, mat: Materializer) extends AbstractController(cc) {

  import PeerActor.transformer

  val channelHandler: ChannelHandlerActor.Ref = ChannelHandlerActor.Ref(
    system.actorOf(ChannelHandlerActor.props, "channel-handler")
  )

  def ws() = WebSocket.accept[PeerActor.Command, PeerActor.Event] { _ =>
    ActorFlow.actorRef { client =>
      PeerActor.props(client, channelHandler)
    }
  }
}
