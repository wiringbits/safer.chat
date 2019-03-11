package com.alexitc.chat.actors

import akka.actor.{ActorSystem, PoisonPill}
import akka.testkit.{TestKit, TestProbe}
import com.alexitc.chat.models.{Channel, Message, Peer}
import org.scalatest.MustMatchers._
import org.scalatest.{BeforeAndAfterAll, WordSpecLike}

class PeerActorSpec
    extends TestKit(ActorSystem("PeerActorSpec"))
        with WordSpecLike
        with BeforeAndAfterAll {

  override def afterAll: Unit = {
    TestKit.shutdownActorSystem(system)
  }

  "the chat" must {
    val channelHandler: ChannelHandlerActor.Ref = ChannelHandlerActor.Ref(
      system.actorOf(ChannelHandlerActor.props, "channel-handler")
    )

    val channelName = Channel.Name("test-channel")

    val aliceClient = TestProbe()
    val aliceName = Peer.Name("alice")
    val alice = system.actorOf(PeerActor.props(aliceClient.ref, channelHandler))

    val bobClient = TestProbe()
    val bobName = Peer.Name("bob")
    val bob = system.actorOf(PeerActor.props(bobClient.ref, channelHandler))

    val message = Message("hola!")

    "allow alice to join" in {
      alice ! PeerActor.Command.JoinChannel(channelName, aliceName)
      aliceClient.expectMsg(PeerActor.Event.ChannelJoined(channelName, Set.empty))
    }

    "allow bob to join" in {
      bob ! PeerActor.Command.JoinChannel(channelName, bobName)
      bobClient.expectMsg(PeerActor.Event.ChannelJoined(channelName, Set(aliceName)))
    }

    "notify alice that bob has joined" in {
      aliceClient.expectMsg(PeerActor.Event.PeerJoined(bobName))
    }

    "allow alice to send a message to bob" in {
      alice ! PeerActor.Command.SendMessage(bobName, message)
      bobClient.expectMsg(PeerActor.Event.MessageReceived(aliceName, message))
    }

    "allow bob to send a message to alice" in {
      bob ! PeerActor.Command.SendMessage(aliceName, message)
      aliceClient.expectMsg(PeerActor.Event.MessageReceived(bobName, message))
    }

    "notify bob when alice leaves" in {
      alice ! PoisonPill
      bobClient.expectMsg(PeerActor.Event.PeerLeft(aliceName))
    }
  }
}
