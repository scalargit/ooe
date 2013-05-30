package org.o2e.cometd.service;

import com.mongodb.BasicDBList;
import com.mongodb.DBObject;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.o2e.cometd.security.AbstractAuthenticator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 3/16/12
 * Time: 9:49 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
public class CollaborationServiceDelegate {

    Logger log = LoggerFactory.getLogger(this.getClass());
    public static final String ID_PARAM = "id";
    public static final String USER_PARAM = "user";
    public static final String CONTEXT_PARAM = "context";

    enum ShareContext {webtop, widget, udop}

    @Inject
    CometDHelper cometDHelper;

    public void getSessions(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) {
        List<Map<String, Object>> sessions = constructList(bayeux.getSessions());
        BasicDBList dbObject = new BasicDBList();
        dbObject.addAll(sessions);
        String statusMessage = "Found "+ sessions.size() + " session(s).";
        log.debug(statusMessage);
        cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), dbObject,
                statusMessage, HttpStatus.SC_OK);
    }

//    public void share(ServerSession remote, ServerMessage message, BayeuxServer bayeux, ServerSession serverSession) {
//        if (cometDHelper.verifyParameter(serverSession, remote, message, CONTEXT_PARAM)) {
//            String contextStr = (String) message.getDataAsMap().get(CONTEXT_PARAM);
//            ShareContext context = ShareContext.valueOf(contextStr);
//            if (ShareContext.webtop.equals(context)) {
//
//            }
//            else {
//                if (cometDHelper.verifyParameter(serverSession, remote, message, ID_PARAM)) {
//                    String id = (String) message.getDataAsMap().get(ID_PARAM);
//
//                }
//            }
//
//        }
//    }

    public List<Map<String, Object>> constructList(List<ServerSession> sessions) {
        List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
        for (ServerSession session : sessions) {
            Map<String, Object> map = constructMap(session);
            if (map != null) list.add(map);
        }
        return list;
    }

    public Map<String, Object> constructMap(ServerSession session) {
        Authentication authData = (Authentication) session.getAttribute(AbstractAuthenticator.AUTH_DATA);
        if (authData != null) {
            Map<String, Object> map = new HashMap<String, Object>();
            map.put(ID_PARAM, session.getId());
            map.put(USER_PARAM, authData.getName());
            return map;
        }
        else return null;
    }

}
