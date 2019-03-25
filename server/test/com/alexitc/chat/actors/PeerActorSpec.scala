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
    val aliceKeys = KeyPairs.generate()
    val bobKeys = KeyPairs.generate()
    val channelHandler: ChannelHandlerActor.Ref = ChannelHandlerActor.Ref(
      system.actorOf(ChannelHandlerActor.props, "channel-handler")
    )

    val channelName = Channel.Name("test-channel")
    val channelSecret = Channel.Secret("dummy-secret")

    val aliceClient = TestProbe()
    val alicePeer = Peer.Simple(Peer.Name("alice"), Peer.Key(aliceKeys.getPublic))
    val alice = system.actorOf(PeerActor.props(aliceClient.ref, channelHandler))

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
