package org.o2e.cometd.service;

import org.cometd.bayeux.server.ConfigurableServerChannel;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;

import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 2/9/12
 * Time: 3:25 PM
 * To change this template use File | Settings | File Templates.
 */
public interface CometDCrudService {

    public Map<String, Object> save(ServerSession remote, ServerMessage message) throws Exception;

    public Map<String, Object> get(ServerSession remote, ServerMessage message) throws Exception;

    public Map<String, Object> remove(ServerSession remote, ServerMessage message) throws Exception;

    public Map<String, Object> find(ServerSession remote, ServerMessage message) throws Exception;
    
}
