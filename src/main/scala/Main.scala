package com.roundeights.shnappyapp

import org.eclipse.jetty.server.Server
import org.eclipse.jetty.servlet._
import javax.servlet.http._

object Main extends App {

    val server = new Server( 80 )
    val context = new ServletContextHandler(ServletContextHandler.SESSIONS)
    context.setContextPath("/")
    server.setHandler(context)
    context.addServlet(new ServletHolder(new HttpServlet {
        override def doGet(
            req: HttpServletRequest, resp: HttpServletResponse
        ): Unit = {
            resp.getWriter.print("Hello World!\n")
        }
    }), "/*")
    server.start()
    server.join()

}
