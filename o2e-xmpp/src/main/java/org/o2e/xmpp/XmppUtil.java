package org.o2e.xmpp;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.annotation.Session;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.packet.Packet;
import org.jivesoftware.smack.packet.PacketExtension;
import org.jivesoftware.smack.packet.Presence;
import org.jivesoftware.smackx.packet.ChatStateExtension;
import org.jivesoftware.smackx.packet.DelayInformation;
import org.jivesoftware.smackx.packet.MUCUser;
import org.o2e.cometd.service.CometDHelper;
import org.o2e.cometd.service.XmppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.UUID;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 1/18/12
 * Time: 11:41 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
@org.cometd.annotation.Service("xmppUtil")
public class XmppUtil {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    CometDHelper cometDHelper;

    public void sendPacket(String sessionId, Packet packet) {
        ServerSession remote = bayeux.getSession(sessionId);
        if (remote != null) {
            try {
                cometDHelper.sendToDataChannel(serverSession, remote, UUID.randomUUID().toString(),
                        constructDbObject(packet), "XMPP Message", HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error constructing XMPP message.";
                log.error(statusMessage, e);
                cometDHelper.sendToDataChannel(serverSession, remote, UUID.randomUUID().toString(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        } else {
            log.debug("No CometD ServerSession found for ID '" + sessionId +
                    "', so ignoring XMPP packet.");
        }

    }

    public DBObject constructDbObject(Packet packet) {
        if (packet instanceof Message) {
            BasicDBObject dbObject = new BasicDBObject();
            Message message = (Message) packet;
            if (message.getThread() != null) dbObject.put(XmppService.THREAD_ID_PARAM, message.getThread());
            if (message.getBodies() != null) {
                BasicDBList bodies = new BasicDBList();
                for (Message.Body body : message.getBodies()) {
                    BasicDBObject bodyObject = new BasicDBObject();
                    bodyObject.put(XmppService.BODY_PARAM, body.getMessage());
                    bodyObject.put(XmppService.LANGUAGE_PARAM, body.getLanguage());
                    bodies.add(bodyObject);
                }
                dbObject.put(XmppService.BODIES_PARAM, bodies);
            }
            dbObject.put(XmppService.PACKET_TYPE_PARAM, Message.class.getName());
            dbObject.put(XmppService.MESSAGE_TYPE_PARAM, message.getType().toString());
            dbObject.put(XmppService.TO_USER_PARAM, message.getTo());
            dbObject.put(XmppService.FROM_USER_PARAM, message.getFrom());

            if (message.getExtensions() != null) {
                for (PacketExtension packetExtension : message.getExtensions()) {
                    if (packetExtension instanceof DelayInformation) {
                        DelayInformation delayInformation = (DelayInformation) packetExtension;
                        dbObject.put(XmppService.FROM_JID_PARAM, delayInformation.getFrom());
                        dbObject.put(XmppService.TIMESTAMP_PARAM, delayInformation.getStamp().getTime());
                    } else if (packetExtension instanceof ChatStateExtension) {
                        ChatStateExtension chatStateExtension = (ChatStateExtension) packetExtension;
                        dbObject.put(XmppService.CHAT_STATE_PARAM, chatStateExtension.getElementName());
                    }
                }
            }

            return dbObject;
        } else if (packet instanceof Presence) {
            BasicDBObject dbObject = new BasicDBObject();
            Presence presence = (Presence) packet;
            dbObject.put(XmppService.PACKET_TYPE_PARAM, Presence.class.getName());
            dbObject.put(XmppService.PRESENCE_TYPE_PARAM, presence.getType().toString());
            dbObject.put(XmppService.FROM_USER_PARAM, presence.getFrom());

            if (presence.getExtensions() != null) {
                for (PacketExtension packetExtension : presence.getExtensions()) {
                    if (packetExtension instanceof MUCUser) {
                        MUCUser mucUser = (MUCUser) packetExtension;
                        if (mucUser.getItem() != null) {
                            dbObject.put(XmppService.FROM_JID_PARAM, mucUser.getItem().getJid());
                        }
                    }
                }
            }

            return dbObject;
        } else {
            log.debug("Packet not of type Message or Presence, so ignoring.");
            return null;
        }
    }

    public void logPacket(Packet packet) {
        log.trace(packet.toXML());
    }

}
