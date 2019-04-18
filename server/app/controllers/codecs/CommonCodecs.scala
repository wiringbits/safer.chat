package controllers.codecs

import play.api.libs.json._

trait CommonCodecs {

  def wrapperFormat[Outer, Inner: Format](wrap: Inner => Outer, unwrap: Outer => Inner): Format[Outer] = new Format[Outer] {
    override def reads(json: JsValue): JsResult[Outer] = {
      json
          .validate[Inner]
          .map(wrap)
    }

    override def writes(o: Outer): JsValue = {
      Json.toJson(unwrap(o))
    }
  }

  def safeWrapperFormat[Outer, Inner: Format](wrap: Inner => Option[Outer], unwrap: Outer => Inner): Format[Outer] = new Format[Outer] {
    override def reads(json: JsValue): JsResult[Outer] = {
      json
          .validate[Inner]
          .flatMap { inner =>
            wrap(inner)
                .map(JsSuccess(_))
                .getOrElse(JsError("Invalid value"))
          }
    }

    override def writes(o: Outer): JsValue = {
      Json.toJson(unwrap(o))
    }
  }
}

object CommonCodecs extends CommonCodecs
