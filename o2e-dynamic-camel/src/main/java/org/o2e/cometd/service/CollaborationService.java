package org.o2e.cometd.service;

import org.cometd.bayeux.server.*;
import org.cometd.annotation.Configure;
import org.cometd.annotation.Listener;
import org.cometd.annotation.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jmx.export.annotation.ManagedOperation;
import org.springframework.jmx.export.annotation.ManagedOperationParameter;
import org.springframework.jmx.export.annotation.ManagedOperationParameters;
import org.springframework.jmx.export.annotation.ManagedResource;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.List;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 3/16/12
 * Time: 9:26 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
@org.cometd.annotation.Service("collaboration")
@ManagedResource
public class CollaborationService {

    Logger log = LoggerFactory.getLogger(this.getClass());

    @Inject
    Authorizer authorizer;

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    CollaborationServiceDelegate collaborationServiceDelegate;

    @Configure("/service/collaboration/**")
    protected void configure(ConfigurableServerChannel channel)
    {
        channel.addAuthorizer(authorizer);
        channel.setPersistent(true);
    }

    @Listener("/service/collaboration/getSessions")
	public void getSessions(ServerSession remote, ServerMessage message) {
        collaborationServiceDelegate.getSessions(remote, message, bayeux, serverSession);
    }

    @ManagedOperation(description="Get a list of maps containing all user sessions.")
    public List<Map<String, Object>> getSessions() {
        return collaborationServiceDelegate.constructList(bayeux.getSessions());
    }

}
