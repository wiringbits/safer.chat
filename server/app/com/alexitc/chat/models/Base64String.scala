package com.alexitc.chat.models

import java.util.Base64

class Base64String private (val string: String) extends AnyVal {

  def bytes: Array[Byte] = {
    Base64.getDecoder.decode(string)
  }
}

object Base64String {

  def apply(bytes: Array[Byte]): Base64String = {
    val string = Base64.getEncoder.encodeToString(bytes)
    new Base64String(string)
  }
}
