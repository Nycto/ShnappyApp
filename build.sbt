import com.typesafe.startscript.StartScriptPlugin

name := "Shnappy-App"

organization := "com.roundeights"

version := "0.1"

scalaVersion := "2.10.1"

seq(StartScriptPlugin.startScriptForClassesSettings: _*)

// append -deprecation to the options passed to the Scala compiler
scalacOptions ++= Seq("-deprecation", "-feature")

// Application dependencies
libraryDependencies ++= Seq(
    "org.eclipse.jetty" % "jetty-webapp" % "8.0.1.v20110908",
    "javax.servlet" % "javax.servlet-api" % "3.0.1" % "provided"
)

