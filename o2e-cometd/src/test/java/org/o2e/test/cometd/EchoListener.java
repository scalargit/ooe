package org.o2e.test.cometd;

import org.cometd.bayeux.Message;
import org.cometd.bayeux.client.ClientSessionChannel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/25/11
 * Time: 10:10 AM
 * To change this template use File | Settings | File Templates.
 */
public class EchoListener implements ClientSessionChannel.MessageListener {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    public void onMessage(ClientSessionChannel clientSessionChannel, Message message) {
        log.debug("Received message: " + message.getJSON());
        log.info("Received " + message.getJSON().getBytes().length + " byte(s).");
    }

}