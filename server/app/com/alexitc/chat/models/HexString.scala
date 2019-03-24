package com.alexitc.chat.models

import javax.xml.bind.DatatypeConverter

import scala.util.Try

class HexString private (val string: String) extends AnyVal {
  def bytes: Array[Byte] = {
    DatatypeConverter.parseHexBinary(string)
  }
}

object HexString {

  def apply(bytes: Array[Byte]): HexString = {
    val string = DatatypeConverter.printHexBinary(bytes)
    new HexString(string)
  }

  def from(string: String): Option[HexString] = {
    Try { DatatypeConverter.parseHexBinary(string) }
        .map(_ => new HexString(string))
        .toOption
  }
}
