package com.alexitc.chat.models

import org.scalatest.MustMatchers._
import org.scalatest.OptionValues._
import org.scalatest.WordSpec

class ChannelSpec extends WordSpec {

  val validNames = List(
    "example",
    "abcdefghijklmnopqrst",
    "abcdefghi klmnopqrst",
    "abcdefghi-klmnopqrst",
    "abcdefghi_klmnopqrst",
    "abcdefghi-0123456789",
    "a x"
  )

  val invalidNames = List(
    "",
    " xxx ",
    "a",
    "b1",
    " xas",
    "xas ",
    "abcdefghijklmnopqrstu",
    "a123,",
    "?asda?"
  )

  "the name" should {
    validNames.foreach { valid =>
      s"Accept $valid" in {
        val result = Channel.Name.from(valid)
        result.value.string must be(valid)
      }
    }

    invalidNames.foreach { invalid =>
      s"Reject $invalid" in {
        val result = Channel.Name.from(invalid)
        result must be(empty)
      }
    }
  }
}
