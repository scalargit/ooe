package org.o2e.server;

import org.eclipse.jetty.start.Main;
import java.io.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 4/1/11
 * Time: 10:13 AM
 * To change this template use File | Settings | File Templates.
 */
public class JettyBootstrap extends AbstractBootstrap {

    public static void main(String[] args) throws IOException {
        JettyBootstrap bootstrap = new JettyBootstrap();
        bootstrap.start(args);
    }

    @Override
    public void doBootstrap(String[] args) {
        System.out.println("Launching Jetty...");
        Main.main(args);
    }
}
