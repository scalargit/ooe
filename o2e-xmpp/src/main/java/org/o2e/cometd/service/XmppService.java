package org.o2e.cometd.service;

import com.mongodb.BasicDBObject;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.*;
import org.cometd.annotation.Configure;
import org.cometd.annotation.Listener;
import org.cometd.annotation.Session;
import org.jivesoftware.smackx.muc.HostedRoom;
import org.o2e.xmpp.XmppConnectionManager;
import org.o2e.xmpp.XmppSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/13/11
 * Time: 10:10 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
@org.cometd.annotation.Service("xmpp")
public class XmppService {

    public static final String PACKET_TYPE_PARAM = "packetType";
    public static final String MESSAGE_TYPE_PARAM = "messageType";
    public static final String PRESENCE_TYPE_PARAM = "presenceType";
    public static final String TIMESTAMP_PARAM = "timestamp";
    public static final String FROM_JID_PARAM = "fromJid";
    public static final String FROM_USER_PARAM = "fromUser";
    public static final String TO_USER_PARAM = "toUser";
    public static final String BODIES_PARAM = "bodies";
    public static final String BODY_PARAM = "body";
    public static final String THREAD_ID_PARAM = "threadId";
    public static final String CHAT_STATE_PARAM = "chatState";
    public static final String ROOM_PARAM = "room";
    public static final String HOST_PARAM = "host";
    public static final String PORT_PARAM = "port";
    public static final String USERNAME_PARAM = "username";
    public static final String PASSWORD_PARAM = "password";
    public static final String NICKNAME_PARAM = "nickname";
    public static final String TEXT_PARAM = "text";
    public static final String SERVICE_NAME_PARAM = "serviceName";
    public static final String CONFERENCE_SERVICE_PARAM = "conferenceService";
    public static final String JSON_PARAM = "json";
    public static final String LANGUAGE_PARAM = "language";

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Inject
    Authorizer authorizer;

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    XmppConnectionManager xmppConnectionManager;

    @Inject
    CometDHelper cometDHelper;

    @Configure("/service/xmpp/**")
    protected void configure(ConfigurableServerChannel channel) {
        channel.addAuthorizer(authorizer);
        channel.setPersistent(true);
    }

    @Listener("/service/xmpp/connect")
    public void connect(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, USERNAME_PARAM) &&
                cometDHelper.verifyParameter(serverSession, remote, message, PASSWORD_PARAM)) {
            Map<String, Object> data = message.getDataAsMap();
            String host = (String) data.get(HOST_PARAM);
            String portStr = (String) data.get(PORT_PARAM);
            int port = portStr == null ? -1 : Integer.valueOf(portStr);
            String username = (String) data.get(USERNAME_PARAM);
            String password = (String) data.get(PASSWORD_PARAM);
            String serviceName = (String) data.get(SERVICE_NAME_PARAM);
            try {
                BasicDBObject dbObject = new BasicDBObject();
                XmppSession xmppSession = xmppConnectionManager.connect(remote.getId(), host, port, username,
                        password, serviceName);
//                dbObject.put("presences", xmppSession.getRosterPresences());
                String statusMessage = "Successfully connected to XMPP server at '" + xmppConnectionManager.getHost() + "'";
                log.info(statusMessage);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), dbObject,
                        statusMessage, HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error connecting to XMPP server at '" + xmppConnectionManager.getHost() + "'";
                log.warn(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Listener("/service/xmpp/disconnect")
    public void disconnect(ServerSession remote, ServerMessage message) {
        try {
            xmppConnectionManager.disconnect(remote.getId());
            String statusMessage = "Successfully disconnected to XMPP server at '" + xmppConnectionManager.getHost() + "'";
            log.info(statusMessage);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                    statusMessage, HttpStatus.SC_OK);
        } catch (Exception e) {
            String statusMessage = "Error disconnecting to XMPP server at '" + xmppConnectionManager.getHost() + "'";
            log.warn(statusMessage, e);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                    statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Listener("/service/xmpp/getRoster")
    public void getRoster(ServerSession remote, ServerMessage message) {
        try {
            BasicDBObject dbObject = new BasicDBObject();
            dbObject.put("presences", xmppConnectionManager.getRoster(remote.getId()));
            String statusMessage = "Successfully obtained presence info for client with id '" + remote.getId() + "'";
            log.info(statusMessage);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), dbObject,
                    statusMessage, HttpStatus.SC_OK);
        } catch (Exception e) {
            String statusMessage = "Error obtaining presence info for client with id '" + remote.getId() + "'";
            log.warn(statusMessage, e);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                    statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Listener("/service/xmpp/listMucs")
    public void listMucs(ServerSession remote, ServerMessage message) {
        Map<String, Object> data = message.getDataAsMap();
        String conferenceService = (String) data.get(CONFERENCE_SERVICE_PARAM);
        BasicDBObject payload = new BasicDBObject();
        try {
            Collection<HostedRoom> rooms = xmppConnectionManager.getHostedRooms(remote.getId(), conferenceService);
            List<Map<String, String>> roomArray = new ArrayList<Map<String, String>>();
            for (HostedRoom room : rooms) {
                Map<String, String> roomMap = new HashMap<String, String>();
                roomMap.put("jid", room.getJid());
                roomMap.put("name", room.getName());
                roomArray.add(roomMap);
            }
            payload.put("mucs", roomArray);
            String statusMessage = "Found " + rooms.size() + " MUC(s)";
            log.info(statusMessage);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), payload,
                    statusMessage, HttpStatus.SC_OK);
        } catch (Exception e) {
            String statusMessage = "Error listing MUCs.";
            log.warn(statusMessage, e);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                    statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Listener("/service/xmpp/joinMuc")
    public void joinMuc(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, NICKNAME_PARAM) &&
                cometDHelper.verifyParameter(serverSession, remote, message, ROOM_PARAM)) {
            Map<String, Object> input = message.getDataAsMap();
            String nickname = (String) input.get(NICKNAME_PARAM);
            String room = (String) input.get(ROOM_PARAM);
            String password = (String) input.get(PASSWORD_PARAM);
            try {
                xmppConnectionManager.joinMuc(remote.getId(), room, nickname, password);
                String statusMessage = "Joined MUC '" + room + "'";
                log.info(statusMessage);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error joining MUC '" + room + "'";
                log.warn(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Listener("/service/xmpp/leaveMuc")
    public void leaveMuc(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, ROOM_PARAM)) {
            Map<String, Object> input = message.getDataAsMap();
            String room = (String) input.get(ROOM_PARAM);
            try {
                xmppConnectionManager.leaveMuc(remote.getId(), room);
                String statusMessage = "Left MUC '" + room + "'";
                log.info(statusMessage);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_OK);
            } catch (Throwable t) {
                String statusMessage = "Error leaving MUC '" + room + "'";
                log.warn(statusMessage, t);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Listener("/service/xmpp/sendToMuc")
    public void sendToMuc(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, ROOM_PARAM) &&
                cometDHelper.verifyParameter(serverSession, remote, message, TEXT_PARAM)) {
            Map<String, Object> input = message.getDataAsMap();
            String room = (String) input.get(ROOM_PARAM);
            String text = (String) input.get(TEXT_PARAM);
            String json = (String) input.get(JSON_PARAM);
            try {
                xmppConnectionManager.sendToMuc(remote.getId(), room, text, json);
                String statusMessage = "Published text '" + text + "' to MUC '" + room + "'";
                log.debug(statusMessage);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error publishing text '" + text + "' to MUC '" + room + "'";
                log.warn(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Listener("/service/xmpp/sendToUser")
    public void sendToUser(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, TO_USER_PARAM) &&
                cometDHelper.verifyParameter(serverSession, remote, message, TEXT_PARAM)) {
            Map<String, Object> input = message.getDataAsMap();
            String toUser = (String) input.get(TO_USER_PARAM);
            String text = (String) input.get(TEXT_PARAM);
            String json = (String) input.get(JSON_PARAM);
            try {
                xmppConnectionManager.sendToUser(remote.getId(), toUser, text, json);
                String statusMessage = "Published text '" + text + "' to user '" + toUser + "'";
                log.debug(statusMessage);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error publishing text '" + text + "' to user '" + toUser + "'";
                log.warn(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

}
