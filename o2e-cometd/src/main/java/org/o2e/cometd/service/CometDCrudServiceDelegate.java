package org.o2e.cometd.service;

import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;

import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 2/14/12
 * Time: 9:21 AM
 * To change this template use File | Settings | File Templates.
 */
public interface CometDCrudServiceDelegate {

    public Map<String, Object> save(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) throws Exception;

    public Map<String, Object> get(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) throws Exception;

    public Map<String, Object> remove(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) throws Exception;

    public Map<String, Object> find(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) throws Exception;

}
