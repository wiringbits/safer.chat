package com.alexitc.chat.models

// TODO: A message must be base64 encoded
case class Message(string: String) extends AnyVal {
  override def toString: String = string
}
