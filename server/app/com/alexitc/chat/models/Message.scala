package com.alexitc.chat.models

case class Message(base64: Base64String) {
  override def toString: String = base64.string
}

object Message {
  def from(string: String): Message = {
    val bytes = string.getBytes("UTF-8")
    Message(Base64String.apply(bytes))
  }
}