package com.alexitc.chat.actors

import java.security.{KeyPair, PrivateKey, PublicKey}

import akka.actor.{ActorRef, ActorSystem, PoisonPill}
import akka.testkit.{TestKit, TestProbe}
import com.alexitc.chat.models._
import controllers.ChannelsController
import javax.crypto.Cipher
import org.scalatest.MustMatchers._
import org.scalatest.{BeforeAndAfterAll, WordSpecLike}
import play.api.libs.json.{Json, Reads}

class PeerActorSpec
    extends TestKit(ActorSystem("PeerActorSpec"))
        with WordSpecLike
        with BeforeAndAfterAll {

  import ChannelsController._
  import PeerActorSpec._

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

    val channelName = Channel.Name.from("test-channel").get
    val channelSecret = Channel.Secret("dummy-secret")

    val alice = TestPeer("alice", channelHandler)
    val bob = TestPeer("bob", channelHandler)
    val carlos = TestPeer("carlos", channelHandler)

    "allow alice to create the channel" in {
      val json = Json.toJson(PeerActor.Command.JoinChannel(channelName, channelSecret, alice.peer))
      println(Json.prettyPrint(json))
      alice.actor ! PeerActor.Command.JoinChannel(channelName, channelSecret, alice.peer)
      alice.client.expectMsg(PeerActor.Event.ChannelJoined(channelName, Set.empty))
    }

    "reject bob due to wrong secret" in {
      bob.actor ! PeerActor.Command.JoinChannel(channelName, Channel.Secret("what?"), bob.peer)
      bob.client.expectMsg(PeerActor.Event.CommandRejected("The secret or the channel is incorrect"))
    }

    "allow bob to join" in {
      bob.actor ! PeerActor.Command.JoinChannel(channelName, channelSecret, bob.peer)
      bob.client.expectMsg(PeerActor.Event.ChannelJoined(channelName, Set(alice.peer)))
    }

    "reject carlos due to channel being full" in {
      carlos.actor ! PeerActor.Command.JoinChannel(channelName, channelSecret, carlos.peer)
      carlos.client.expectMsg(PeerActor.Event.CommandRejected("The channel is full, if you need bigger channels, write us to support@hidden.chat"))
    }

    "notify alice that bob has joined" in {
      alice.client.expectMsg(PeerActor.Event.PeerJoined(bob.peer))
    }

    val plainTextMessage = "hola!"
    val message = Message(Base64String.apply(encrypt(bob.keys.getPublic, plainTextMessage)))
    "allow alice to send a message to bob encrypting it with bob's key" in {
      val json = Json.toJson(PeerActor.Command.SendMessage(bob.peer.name, message))
      println(Json.prettyPrint(json))
      alice.actor ! PeerActor.Command.SendMessage(bob.peer.name, message)
      bob.client.expectMsg(PeerActor.Event.MessageReceived(alice.peer, message))
    }

    "allow bob to send a message to alice" in {
      bob.actor ! PeerActor.Command.SendMessage(alice.peer.name, message)
      alice.client.expectMsg(PeerActor.Event.MessageReceived(bob.peer, message))
    }

    "allow bob to decrypt the message from alice" in {
      val text = decrypt(bob.keys.getPrivate, message.base64.bytes)
      text must be(plainTextMessage)
    }

    "notify bob when alice leaves" in {
      alice.actor ! PoisonPill
      bob.client.expectMsg(PeerActor.Event.PeerLeft(alice.peer))
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

object PeerActorSpec {
  case class TestPeer(
      keys: KeyPair,
      client: TestProbe,
      peer: Peer,
      actor: ActorRef)

  object TestPeer {
    def apply(
        name: String,
        channelHandler: ChannelHandlerActor.Ref)(
        implicit system: ActorSystem,
        reads: Reads[PeerActor.Command]): TestPeer = {

      val keys = KeyPairs.generate()
      val client = TestProbe()
      val peer = Peer.Simple(Peer.Name.from(name).get, Peer.Key(keys.getPublic))
      val actor = system.actorOf(PeerActor.props(client.ref, channelHandler))
      TestPeer(keys, client, peer, actor)
    }
  }
}
