package controllers

import akka.actor.Actor
import javax.inject.Inject
import play.api.libs.json.{JsValue, Reads}
import play.api.mvc.{AbstractController, ControllerComponents}

class ChannelsController @Inject() (cc: ControllerComponents) extends AbstractController(cc) {

  def create() = Action.async[JsValue] { x =>
    ???
  }
}

class ChannelName(val string: String) extends AnyVal
object ChannelName {
  def from(string: String): Option[ChannelName] = {
    ???
  }

  implicit val reads: Reads[ChannelName] = ???
}

case class CreateChannelRequest(channel: ChannelName, author: String, publicKey: String)
object CreateChannelRequest {

  implicit val reads: Reads[CreateChannelRequest] = ???

}

class Channel(name: String) extends Actor {
  override def receive: Receive = {
    ???
  }
}
