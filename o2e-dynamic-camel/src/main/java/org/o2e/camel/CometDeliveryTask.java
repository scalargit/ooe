package org.o2e.camel;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.camel.Exchange;
import org.apache.camel.Message;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.ServerSession;
import org.json.JSONObject;
import org.o2e.camel.builders.AbstractOoeRouteBuilder;
import org.o2e.cometd.service.ServiceResponseMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/13/11
 * Time: 2:58 PM
 * To change this template use File | Settings | File Templates.
 */
public class CometDeliveryTask implements Runnable {

    Logger log = LoggerFactory.getLogger(this.getClass());

    Exchange exchange;
    ServerSession serverSession;
    ServerSession remoteSession;

    public CometDeliveryTask(Exchange exchange, ServerSession serverSession, ServerSession remoteSession) {
        this.exchange = exchange;
        this.serverSession = serverSession;
        this.remoteSession = remoteSession;
    }

    public void run() {
        try {
            String statusMessage = "";
            int statusCode = HttpStatus.SC_OK;
            ServiceResponseMessage forward = new ServiceResponseMessage();
            // TODO: Add hook here for user-specific data transformation
            forward.setChannel("/data/" + remoteSession.getId());
            forward.setId(UUID.randomUUID().toString());
            forward.setStatusCode(statusCode);
            forward.setMessage(statusMessage);
            forward.setData(extractBody());
            remoteSession.deliver(serverSession, forward);
        } catch (Exception e) {
            log.error("Error delivering message.", e);
        }
    }

    /**
     * Attempts to extract the Exchange Body in the most appropriate way. Will look for the Exchange property
     * 'bodyClass'. If present, we will attempt to read the Exchange Body as an instance of that Class. Otherwise, we
     * will attempt to read it as a DBObject. If that fails
     *
     * @return
     */
    private Object extractBody() {
        Message in = exchange.getIn();
        Object body = null;
        Object bodyClass = exchange.getProperty(AbstractOoeRouteBuilder.BODY_CLASS_PROPERTY);
        if (bodyClass == null) {
            log.debug("Attempting to read Exchange Body as a DBObject...");
            body = in.getBody(DBObject.class);
            if (body == null) {
                log.debug("Attempting to read Exchange Body as a JSONObject...");
                body = in.getBody(JSONObject.class);
                if (body == null) {
                    log.debug("Attempting to read Exchange Body as a String...");
                    body = in.getBody(String.class);
                    if (body != null) {
                        log.debug("Attempting to parse Exchange Body String as a DBObject...");
                        DBObject dbObject = (DBObject) JSON.parse((String) body);
                        if (dbObject != null) body = dbObject;
                    }
                    else {
                        throw new IllegalArgumentException("Could not extract Body from this exchange.");
                    }
                }
            }
        } else if (bodyClass instanceof Class) {
            log.debug("Attempting to read Exchange Body as a '" + bodyClass + "'...");
            body = in.getBody((Class) bodyClass);
        } else {
            throw new IllegalArgumentException("Exchange property '" + AbstractOoeRouteBuilder.BODY_CLASS_PROPERTY +
                    "' must be of type '" + Class.class + "'");
        }
        return body;
    }

    public Exchange getExchange() {
        return exchange;
    }

    public void setExchange(Exchange exchange) {
        this.exchange = exchange;
    }

    public ServerSession getServerSession() {
        return serverSession;
    }

    public void setServerSession(ServerSession serverSession) {
        this.serverSession = serverSession;
    }

    public ServerSession getRemoteSession() {
        return remoteSession;
    }

    public void setRemoteSession(ServerSession remoteSession) {
        this.remoteSession = remoteSession;
    }
}
