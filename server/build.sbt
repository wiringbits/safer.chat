name := "chat-server"
organization := "com.alexitc"
scalaVersion := "2.12.8"

fork in Test := true

scalacOptions ++= Seq(
//  "-Xfatal-warnings",
  "-unchecked",
  "-deprecation",
  "-feature",
  "-target:jvm-1.8",
  "-encoding", "UTF-8",
  "-Xfuture",
  "-Xlint:missing-interpolator",
  "-Yno-adapted-args",
  "-Ywarn-dead-code",
  "-Ywarn-numeric-widen",
  "-Ywarn-value-discard",
  "-Ywarn-unused",
  "-Ywarn-unused-import",
  "-Ywarn-macros:after"
)

lazy val root = (project in file("."))
    .enablePlugins(PlayScala)

libraryDependencies ++= Seq(guice, evolutions, jdbc, ws)

libraryDependencies += "com.google.inject" % "guice" % "4.2.0"

libraryDependencies += "org.slf4j" % "slf4j-api" % "1.7.25"
libraryDependencies += "ch.qos.logback" % "logback-core" % "1.2.3"
libraryDependencies += "ch.qos.logback" % "logback-classic" % "1.2.3"

libraryDependencies += "org.scalatestplus.play" %% "scalatestplus-play" % "3.1.0" % Test
libraryDependencies += "org.mockito" % "mockito-core" % "2.15.0" % Test

libraryDependencies += "com.typesafe.akka" %% "akka-testkit" % "2.5.21" % Test
