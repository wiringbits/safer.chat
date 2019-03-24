package com.alexitc.chat.actors

import akka.actor.{ActorSystem, PoisonPill}
import akka.testkit.{TestKit, TestProbe}
import com.alexitc.chat.models.{Channel, KeyPairs, Message, Peer}
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
    val dummyKey = Peer.Key(KeyPairs.generate().getPublic)
    val channelHandler: ChannelHandlerActor.Ref = ChannelHandlerActor.Ref(
      system.actorOf(ChannelHandlerActor.props, "channel-handler")
    )

    val channelName = Channel.Name("test-channel")

    val aliceClient = TestProbe()
    val alicePeer = Peer.Simple(Peer.Name("alice"), dummyKey)
    val alicePeerWithRef = Peer.HasRef(Peer.Name("alice"), dummyKey, aliceClient.ref)
    val alice = system.actorOf(PeerActor.props(aliceClient.ref, channelHandler))

    val bobClient = TestProbe()
    val bobPeer = Peer.Simple(Peer.Name("bob"), dummyKey)
    val bob = system.actorOf(PeerActor.props(bobClient.ref, channelHandler))

    val message = Message("hola!")

    "allow alice to join" in {
      alice ! PeerActor.Command.JoinChannel(channelName, alicePeer)
      aliceClient.expectMsg(PeerActor.Event.ChannelJoined(channelName, Set.empty))
    }

    "allow bob to join" in {
      bob ! PeerActor.Command.JoinChannel(channelName, bobPeer)
      bobClient.expectMsg(PeerActor.Event.ChannelJoined(channelName, Set(alicePeer)))
    }

    "notify alice that bob has joined" in {
      aliceClient.expectMsg(PeerActor.Event.PeerJoined(bobPeer))
    }

    "allow alice to send a message to bob" in {
      alice ! PeerActor.Command.SendMessage(bobPeer.name, message)
      bobClient.expectMsg(PeerActor.Event.MessageReceived(alicePeer, message))
    }

    "allow bob to send a message to alice" in {
      bob ! PeerActor.Command.SendMessage(alicePeer.name, message)
      aliceClient.expectMsg(PeerActor.Event.MessageReceived(bobPeer, message))
    }

    "notify bob when alice leaves" in {
      alice ! PoisonPill
      bobClient.expectMsg(PeerActor.Event.PeerLeft(alicePeer))
    }
  }
}
