package org.o2e.cometd.service.collection;

import org.cometd.bayeux.server.*;
import org.cometd.java.annotation.Configure;
import org.cometd.java.annotation.Listener;
import org.cometd.java.annotation.Session;
import org.o2e.cometd.service.CometDCrudService;
import org.o2e.cometd.service.CometDCrudServiceDelegate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 2/14/12
 * Time: 9:13 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
@org.cometd.java.annotation.Service("collection")
public class CometDCollectionService implements CometDCrudService {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    Authorizer authorizer;

    @Inject
    CometDCrudServiceDelegate cometDCrudServiceDelegate;

    @Configure("/service/collection/**")
    public void configure(ConfigurableServerChannel channel)
    {
        channel.addAuthorizer(authorizer);
        channel.setPersistent(true);
    }

    @Listener("/service/collection/save")
    public Map<String, Object> save(ServerSession remote, ServerMessage message) throws Exception {
        return cometDCrudServiceDelegate.save(remote, message, bayeux, serverSession);
    }

    @Listener("/service/collection/get")
    public Map<String, Object> get(ServerSession remote, ServerMessage message) throws Exception {
        return cometDCrudServiceDelegate.get(remote, message, bayeux, serverSession);
    }

    @Listener("/service/collection/remove")
    public Map<String, Object> remove(ServerSession remote, ServerMessage message) throws Exception {
        return cometDCrudServiceDelegate.remove(remote, message, bayeux, serverSession);

    }

    @Listener("/service/collection/find")
    public Map<String, Object> find(ServerSession remote, ServerMessage message) throws Exception {
        return cometDCrudServiceDelegate.find(remote, message, bayeux, serverSession);
    }

}
