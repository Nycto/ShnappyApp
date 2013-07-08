package com.roundeights.shnappyapp

import scala.concurrent.ExecutionContext.Implicits.global
import com.roundeights.skene.Skene
import com.roundeights.shnappy.handler.SiteEntry
import com.roundeights.shnappy.Env

/** Main entry point and configuration */
class Main extends Skene {

    /** Returns an env setting */
    private def setting( key: String ) = Option( System.getenv(key) )

    val env =
        setting("HEROKU_PROD").filter( _ == "true" )
            .map( _ => Env.prod( setting _, classOf[Main] ) )
            .getOrElse( Env.local )

    println( env )

    delegate( new SiteEntry(env) )
}

