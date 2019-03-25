package com.alexitc.chat.actors

import java.security.{PrivateKey, PublicKey}

import akka.actor.{ActorSystem, PoisonPill}
import akka.testkit.{TestKit, TestProbe}
import com.alexitc.chat.models._
import javax.crypto.Cipher
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
    val config = ChannelHandlerActor.Config(
      maxPeersOnChannel = 2,
      supportEmail = "support@hidden.chat"
    )

    val channelHandler: ChannelHandlerActor.Ref = ChannelHandlerActor.Ref(
      system.actorOf(ChannelHandlerActor.props(config), "channel-handler")
    )

    val channelName = Channel.Name("test-channel")
    val channelSecret = Channel.Secret("dummy-secret")

    val aliceKeys = KeyPairs.generate()
    val aliceClient = TestProbe()
    val alicePeer = Peer.Simple(Peer.Name("alice"), Peer.Key(aliceKeys.getPublic))
    val alice = system.actorOf(PeerActor.props(aliceClient.ref, channelHandler))

    val bobKeys = KeyPairs.generate()
    val bobClient = TestProbe()
    val bobPeer = Peer.Simple(Peer.Name("bob"), Peer.Key(bobKeys.getPublic))
    val bob = system.actorOf(PeerActor.props(bobClient.ref, channelHandler))

    "allow alice to create the channel" in {
      alice ! PeerActor.Command.JoinChannel(channelName, channelSecret, alicePeer)
      aliceClient.expectMsg(PeerActor.Event.ChannelJoined(channelName, Set.empty))
    }

    "reject bob due to wrong secret" in {
      bob ! PeerActor.Command.JoinChannel(channelName, Channel.Secret("what?"), bobPeer)
      bobClient.expectMsg(PeerActor.Event.CommandRejected("The secret or the channel is incorrect"))
    }

    "allow bob to join" in {
      bob ! PeerActor.Command.JoinChannel(channelName, channelSecret, bobPeer)
      bobClient.expectMsg(PeerActor.Event.ChannelJoined(channelName, Set(alicePeer)))
    }

    val carlosKeys = KeyPairs.generate()
    val carlosClient = TestProbe()
    val carlosPeer = Peer.Simple(Peer.Name("carlos"), Peer.Key(carlosKeys.getPublic))
    val carlos = system.actorOf(PeerActor.props(carlosClient.ref, channelHandler))
    "reject carlos due to channel being full" in {
      carlos ! PeerActor.Command.JoinChannel(channelName, channelSecret, carlosPeer)
      carlosClient.expectMsg(PeerActor.Event.CommandRejected("The channel is full, if you need bigger channels, write us to support@hidden.chat"))
    }

    "notify alice that bob has joined" in {
      aliceClient.expectMsg(PeerActor.Event.PeerJoined(bobPeer))
    }

    val plainTextMessage = "hola!"
    val message = Message(Base64String.apply(encrypt(bobKeys.getPublic, plainTextMessage)))
    "allow alice to send a message to bob encrypting it with bob's key" in {
      alice ! PeerActor.Command.SendMessage(bobPeer.name, message)
      bobClient.expectMsg(PeerActor.Event.MessageReceived(alicePeer, message))
    }

    "allow bob to send a message to alice" in {
      bob ! PeerActor.Command.SendMessage(alicePeer.name, message)
      aliceClient.expectMsg(PeerActor.Event.MessageReceived(bobPeer, message))
    }

    "allow bob to decrypt the message from alice" in {
      val text = decrypt(bobKeys.getPrivate, message.base64.bytes)
      text must be(plainTextMessage)
    }

    "notify bob when alice leaves" in {
      alice ! PoisonPill
      bobClient.expectMsg(PeerActor.Event.PeerLeft(alicePeer))
    }
  }

  private def encrypt(key: PublicKey, message: String): Array[Byte] = {
    val cipher = Cipher.getInstance("RSA")
    cipher.init(Cipher.ENCRYPT_MODE, key)

    cipher.doFinal(message.getBytes("UTF-8"))
  }

  private def decrypt(key: PrivateKey, message: Array[Byte]): String = {
    val cipher = Cipher.getInstance("RSA")
    cipher.init(Cipher.DECRYPT_MODE, key)

    val bytes = cipher.doFinal(message)
    new String(bytes)
  }

}
