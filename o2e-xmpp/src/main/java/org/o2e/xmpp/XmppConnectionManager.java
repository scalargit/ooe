package org.o2e.xmpp;

import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.annotation.Session;
import org.eclipse.jetty.util.ConcurrentHashSet;
import org.jivesoftware.smack.Chat;
import org.jivesoftware.smack.ConnectionConfiguration;
import org.jivesoftware.smack.XMPPConnection;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.util.StringUtils;
import org.jivesoftware.smackx.muc.HostedRoom;
import org.jivesoftware.smackx.muc.MultiUserChat;
import org.o2e.cometd.service.CometDHelper;
import org.o2e.cometd.service.XmppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/17/11
 * Time: 11:02 AM
 * This functionality should exist in Camel, but the XMPP Component is insufficient.
 */
@Named
@Singleton
@org.cometd.annotation.Service("xmppConnectionManager")
public class XmppConnectionManager {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    Map<String, XmppSession> sessions = new ConcurrentHashMap<String, XmppSession>();

    @Value("${org.o2e.server.xmpp.host}")
    String host;

    @Value("${org.o2e.server.xmpp.port}")
    int port;

		@Value("${org.o2e.server.xmpp.serviceName}")
	  String serviceName;

    @Value("${org.o2e.server.xmpp.conferenceService}")
    String conferenceService;

    @Value("${org.o2e.server.xmpp.gc.enabled}")
    boolean gcEnabled = true;

    @Value("${org.o2e.server.xmpp.hostedRoomCache.ttlMillis}")
    protected long hostedRoomCacheTtlMillis = HOSTED_ROOM_CACHE_TTL_MILLIS_DEFAULT;

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    CometDHelper cometDHelper;

    @Inject
    XmppUtil xmppUtil;

    public static final long HOSTED_ROOM_CACHE_TTL_MILLIS_DEFAULT = 1000 * 60 * 15;

    /**
     * A prefix helps to make sure that ID's are unique across mutliple instances.
     */
    private static String prefix = StringUtils.randomString(5);

    protected Collection<HostedRoom> rooms = new ArrayList<HostedRoom>();

    protected long roomsLastUpdated = 0;

    /**
     * Keeps track of the current increment, which is appended to the prefix to
     * forum a unique ID.
     */
    private static long id = 0;

    /**
     * Returns the next unique id. Each id made up of a short alphanumeric
     * prefix along with a unique numeric value.
     *
     * @return the next id.
     */
    private static synchronized String nextID() {
        return prefix + Long.toString(id++);
    }

    //    @Async
    public XmppSession connect(String sessionId, String host, int port, String user, String password,
                               String serviceName) throws XMPPException {
        XmppSession session = sessions.get(sessionId);
        if (session == null) {
            // Remove any existing sessions first
            Set<String> oldSessions = new ConcurrentHashSet<String>();
            for (Map.Entry entry : sessions.entrySet()) {
                session = (XmppSession) entry.getValue();
                String oldUser = session.getConnection().getUser() != null ?
                        session.getConnection().getUser().substring(0, session.getConnection().getUser().indexOf("@")) :
                        null;
                if (!session.getConnection().isConnected() || user.equals(oldUser)) {
                    oldSessions.add((String) entry.getKey());
                }
            }
            // Remove old sessions
            for (String id : oldSessions) {
                log.debug("Removing existing session for " + user + "' with id '" + id + "'.");
                sessions.remove(id);
            }

            // Create new connection and login
            if (host == null) host = this.host;
            if (port < 1) port = this.port;
	          if (serviceName == null) serviceName = this.serviceName;
            ConnectionConfiguration config = null;
            if (serviceName == null) config = new ConnectionConfiguration(host, port);
            else config = new ConnectionConfiguration(host, port, serviceName);
            config.setSendPresence(true);
            config.setSecurityMode(ConnectionConfiguration.SecurityMode.required);
            log.debug("Connecting to XMPP server at '" + config.getHost() + ":" + config.getPort() +
                    (serviceName == null ? "" : "/" + serviceName));
            XMPPConnection connection = new XMPPConnection(config);
            connection.connect();
            connection.login(user, password);
            session = new XmppSession(connection, sessionId, bayeux, serverSession, cometDHelper, xmppUtil);
            log.trace("Adding new session with id '" + sessionId + "'");
            sessions.put(sessionId, session);
        } else log.warn("User '" + user + "' is already connected to XMPP server at '" + host + "'");
        return session;
    }

    public void disconnect(String sessionId) {
        XmppSession session = sessions.get(sessionId);
        if (session != null) {
            XMPPConnection xmppConnection = session.getConnection();
            if (xmppConnection != null) {
                log.debug("Removing existing XMPP session with CometD id '" + sessionId + "'.");
                if (xmppConnection.isConnected()) {
                    xmppConnection.disconnect();
                }
                sessions.remove(sessionId);
            }
        } else log.warn("Session with id '" + sessionId + "' not found, so could not disconnect from XMPP service.");
    }

    public List<Map<String, String>> getRoster(String sessionId) {
        XmppSession session = sessions.get(sessionId);
        if (session != null) {
            XMPPConnection xmppConnection = session.getConnection();
            if (xmppConnection != null) {
                log.debug("Retrieving roster for XMPP user with CometD id '" + sessionId + "'.");
                return session.getRosterPresences();
            }
        } else log.warn("Session with id '" + sessionId + "' not found, so could not disconnect from XMPP service.");
        return null;
    }

    //    @Async
    public Collection<HostedRoom> getHostedRooms(String sessionId, String conferenceService) throws XMPPException {
        if (roomsLastUpdated + hostedRoomCacheTtlMillis < new Date().getTime()) {
            XmppSession session = sessions.get(sessionId);
            if (session != null) {
                if (conferenceService == null) conferenceService = this.conferenceService;
                log.debug("Listing MUCs at conferenceService '" + conferenceService + "'");
                rooms = MultiUserChat.getHostedRooms(session.getConnection(), conferenceService);
                roomsLastUpdated = new Date().getTime();
            } else throw new XMPPException("Cannot list MUCs because no XMPP session was found for CometD session '" +
                    sessionId + "'");
        }
        return rooms;
    }

    //    @Async
    public void joinMuc(final String sessionId, String room, String nickname, String password)
            throws ExecutionException, XMPPException {
        XmppSession session = sessions.get(sessionId);
        if (session != null) {
            session.joinMuc(room, password, nickname);
        } else throw new XMPPException("Cannot join MUC '" + room + "' because user with nickname '" + nickname +
                "' and sessionId '" + sessionId + "' is not logged in.");
    }

    public void leaveMuc(String sessionId, String room) throws Throwable {
        XmppSession session = sessions.get(sessionId);
        if (session != null) {
            session.leaveMuc(room);
        } else throw new XMPPException("Cannot leave MUC '" + room + "' because user with sessionId '" + sessionId +
                "' is not logged in.");
    }

    //    @Async
    public void sendToMuc(String sessionId, String room, String text, String json) throws ExecutionException, XMPPException {
        XmppSession session = sessions.get(sessionId);
        if (session != null) {
            MultiUserChat chat = session.getMuc(room);
            if (chat.isJoined()) {
                log.debug("Sending chat message for user '" + session.getConnection().getUser() +
                        "' to room '" + room + "' with text '" + text + "'");
                Message message = chat.createMessage();
                if (json != null && json.trim().length() > 0) message.addBody(XmppService.JSON_PARAM, json);
                message.setBody(text);
                chat.sendMessage(text);
            } else
                throw new XMPPException("User '" + session.getConnection().getUser() + "' is not joined to MUC '" + room + "'");
        } else throw new XMPPException("Cannot send message to MUC '" + room + "' because user with sessionId '" +
                sessionId + "' is not logged in.");

    }

    public void sendToUser(String sessionId, String toUser, String text, String json) throws XMPPException, ExecutionException {
        XmppSession session = sessions.get(sessionId);
        if (session != null) {
            Chat chat = session.getChat(toUser);
            Message message = new Message(toUser, Message.Type.chat);
            message.setFrom(session.getConnection().getUser());
            message.setThread(chat.getThreadID());
            message.addBody(null, text);
            if (json != null) message.addBody(XmppService.JSON_PARAM, json);
            session.getConnection().sendPacket(message);
        } else throw new XMPPException("Cannot send message to user '" + toUser + "' because user with sessionId '" +
                sessionId + "' is not logged in.");
    }

    @Scheduled(fixedDelay = 60000)
    public void garbageCollect() {
        if (gcEnabled) {
            log.debug("Running XMPP Service Garbage Collection on " + sessions.size() + " session(s)...");

            // Mark all disconnected CometD sessions for removal
            Set<String> oldSessions = new ConcurrentHashSet<String>();
            for (Map.Entry entry : sessions.entrySet()) {
                String sessionId = (String) entry.getKey();
                XmppSession session = (XmppSession) entry.getValue();
                ServerSession remote = bayeux.getSession(sessionId);
                if (remote == null || !remote.isConnected()) {
                    oldSessions.add(sessionId);
                }
            }

            // Remove old XMPP sessions for any disconnected CometD sessions
            log.info("Found " + oldSessions.size() + " dead session(s) to remove.");
            for (String id : oldSessions) {
                disconnect(id);
            }
        }
    }

//    private XMPPConnection getConnection(String user, String password) throws XMPPException {
//        XMPPConnection connection = connections.get(user);
//        if (connection == null) {
//            ConnectionConfiguration config = new ConnectionConfiguration(host, port);
//            connection = new XMPPConnection(config);
//            connection.connect();
//            connection.login(user, password);
//            connections.put(user, connection);
//        }
//        return connection;
//    }

    public String getHost() {
        return host;
    }

    public int getPort() {
        return port;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public boolean isGcEnabled() {
        return gcEnabled;
    }

    public void setGcEnabled(boolean gcEnabled) {
        this.gcEnabled = gcEnabled;
    }
}
