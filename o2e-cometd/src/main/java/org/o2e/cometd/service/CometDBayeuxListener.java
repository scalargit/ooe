package org.o2e.cometd.service;

import com.mongodb.BasicDBObject;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerChannel;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.java.annotation.Session;
import org.o2e.cometd.security.AbstractAuthenticator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jmx.export.annotation.ManagedOperation;
import org.springframework.jmx.export.annotation.ManagedResource;
import org.springframework.security.core.Authentication;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/8/11
 * Time: 9:43 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
@org.cometd.java.annotation.Service("cometDBayeuxListener")
@ManagedResource
public class CometDBayeuxListener implements BayeuxServer.SessionListener, BayeuxServer.SubscriptionListener {

    Logger log = LoggerFactory.getLogger(this.getClass());

    public static final String USERNAME_PARAM = "username";
    public static final String AUTHORITIES_PARAM = "authorities";

    @Session
    ServerSession serverSession;

    @Inject
    BayeuxServer bayeux;

    @Inject
    CometDHelper cometDHelper;

    @PostConstruct
    public void init() {
        bayeux.addListener(this);
    }

    public void subscribed(ServerSession remote, ServerChannel serverChannel) {
        log.debug("Session with id '" + remote.getId() + "' subscribed to channel '" + serverChannel + "'");
        if (serverChannel.getId().equals(cometDHelper.getDataChannel(remote))) {
            BasicDBObject dbObject = new BasicDBObject();
            Authentication authentication = (Authentication) remote.getAttribute(AbstractAuthenticator.AUTH_DATA);
            if (authentication != null) {
                dbObject.put(USERNAME_PARAM, authentication.getName());
                dbObject.put(AUTHORITIES_PARAM, authentication.getAuthorities());
            }
            else {
                dbObject.put(USERNAME_PARAM, "Guest");
            }
            cometDHelper.sendToDataChannel(serverSession, remote, UUID.randomUUID().toString(), dbObject,
                    "Session subscribed to channel '" + serverChannel + "'.", HttpStatus.SC_OK);
        }
    }

    public void unsubscribed(ServerSession remote, ServerChannel serverChannel) {
        log.debug("Session with id '" + remote.getId() + "' unsubscribed from channel '" + serverChannel + "'");
    }

    public void sessionAdded(ServerSession remote) {
        log.info("Session added with id '" + remote.getId() + "'");
    }

    public void sessionRemoved(ServerSession remote, boolean timedOut) {
        log.info("Session removed with id '" + remote.getId() + "'. Timedout = " + timedOut);
    }

    @ManagedOperation
    public List<String> getLoggedInUsers() {
        List<String> users = new ArrayList<String>();
        for (ServerSession remote : bayeux.getSessions()) {
            Authentication authentication = (Authentication) remote.getAttribute(AbstractAuthenticator.AUTH_DATA);
            if (authentication != null) {
                users.add("Session ID: " + remote.getId() + ", User: " + authentication.getName());
            }
        }
        return users;
    }

}
