package com.roundeights.shnappyapp

import scala.concurrent.ExecutionContext.Implicits.global
import com.roundeights.skene.Skene
import com.roundeights.shnappy.handler.SiteEntry

class Main extends Skene {
    delegate( new SiteEntry )
}

