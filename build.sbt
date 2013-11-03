name := "Shnappy-App"

organization := "com.roundeights"

version := "0.1"

scalaVersion := "2.10.3"

// Support for the web plugin
seq(webSettings :_*)

// append -deprecation to the options passed to the Scala compiler
scalacOptions ++= Seq("-deprecation", "-feature")

// Set a custom resource directory to pull in built assets
resourceDirectory in Compile <<= (target in Compile)( _ / "resources" )

publishTo := Some("Spikemark" at "https://spikemark.herokuapp.com/maven/roundeights")

credentials += Credentials(Path.userHome / ".ivy2" / ".credentials")

resolvers ++= Seq("RoundEights" at "http://maven.spikemark.net/roundeights")

// Application dependencies
libraryDependencies ++= Seq(
    "com.roundeights" %% "shnappy" % "0.1",
    "com.roundeights" %% "skene" % "0.1",
    "com.roundeights" %% "tubeutil" % "0.1",
    "net.databinder.dispatch" %% "dispatch-core" % "0.10.1",
    "org.eclipse.jetty" % "jetty-webapp" % "8.0.1.v20110908" % "container",
    "javax.servlet" % "javax.servlet-api" % "3.0.1" % "provided"
)

