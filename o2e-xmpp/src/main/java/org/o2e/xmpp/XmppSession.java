package org.o2e.xmpp;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerSession;
import org.jivesoftware.smack.*;
import org.jivesoftware.smack.filter.PacketFilter;
import org.jivesoftware.smack.packet.Message;
import org.jivesoftware.smack.packet.Packet;
import org.jivesoftware.smack.packet.Presence;
import org.jivesoftware.smackx.muc.DiscussionHistory;
import org.jivesoftware.smackx.muc.MultiUserChat;
import org.o2e.cometd.service.XmppService;
import org.o2e.cometd.service.CometDHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/17/11
 * Time: 4:06 PM
 * To change this template use File | Settings | File Templates.
 */
public class XmppSession implements PacketListener, MessageListener, RosterListener {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    protected XMPPConnection connection;

    protected LoadingCache<String, Chat> chats;

    protected LoadingCache<String, MucExtension> mucs;

    protected LinkedHashMap<String, Boolean> packets;

    protected LoadingCache<String, Lock> lockMap;

    protected String sessionId;

    protected BayeuxServer bayeux;
    
    protected ServerSession serverSession;

    protected CometDHelper cometDHelper;

    protected XmppUtil xmppUtil;

    public XmppSession(XMPPConnection connection, String sessionId, BayeuxServer bayeux, ServerSession serverSession,
                       CometDHelper cometDHelper, XmppUtil xmppUtil) {
        this.connection = connection;
        this.sessionId = sessionId;
        this.bayeux = bayeux;
        this.serverSession = serverSession;
        this.cometDHelper = cometDHelper;
        this.xmppUtil = xmppUtil;
        this.lockMap = CacheBuilder.newBuilder()
                .concurrencyLevel(1)
                .weakValues()
                .build(
                        new CacheLoader<String, Lock>() {
                            public Lock load(String key) {
                                return new ReentrantLock();
                            }
                        });
        this.chats = CacheBuilder.newBuilder().
                maximumSize(10000).
                build(new XmppChatCacheLoader(this));
        this.mucs = CacheBuilder.newBuilder().
                maximumSize(10000).
                build(new XmppMucCacheLoader(this));
        this.packets = new LinkedHashMap<String, Boolean>() {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
                return size() > 1000;
            }
        };
        connection.addPacketListener(this, new PacketFilter() {
            public boolean accept(Packet packet) {
                return true;
            }
        });
        connection.getRoster().addRosterListener(this);
    }

    public MucExtension getMuc(String room) throws ExecutionException {
        return mucs.get(room);
    }

    public Chat getChat(String participant) throws ExecutionException {
        return chats.get(participant);
    }

    public void joinMuc(String room, String password, String nickname) throws ExecutionException, XMPPException {
        // Use a lock around the intern() of the room String to protect against race conditions caused by concurrent
        // calls to this method with the same parameters
        Lock lock = null;
        try {
            lock = lockMap.get(room.intern());
            if (lock != null) lock.lock();
            MultiUserChat muc = getMuc(room);
            if (muc.isJoined()) {
                log.debug("User with nickname '" + nickname + "' and sessionId '" + sessionId +
                        "' is already joined to MUC '" + room + "'");
            }
            else {
                log.debug("Adding MUC listeners...");
                muc.addParticipantListener(new PacketListener() {
                    public void processPacket(Packet packet) {
                        xmppUtil.logPacket(packet);
                        xmppUtil.sendPacket(sessionId, packet);
                    }
                });
                muc.addMessageListener(new PacketListener() {
                    public void processPacket(Packet packet) {
                        xmppUtil.logPacket(packet);
                        xmppUtil.sendPacket(sessionId, packet);
                    }
                });
                DiscussionHistory discussionHistory = new DiscussionHistory();
//                discussionHistory.setMaxStanzas(25); // Get no more than 25 historical messages
//                discussionHistory.setSeconds(60 * 60 * 24); // Get all messages in the last 24 hours
                log.debug("Joining MUC '" + room + "' as user '" + nickname + "'");
                if (password == null || password.trim().length() == 0) muc.join(nickname, null, discussionHistory,
                        SmackConfiguration.getPacketReplyTimeout());
                else muc.join(nickname, password, discussionHistory, SmackConfiguration.getPacketReplyTimeout());
            }
        } finally {
            if (lock != null) lock.unlock();
        }
    }

    public void leaveMuc(String room) throws Throwable {
        // Use a lock around the intern() of the room String to protect against race conditions caused by concurrent
        // calls to this method with the same parameters
        Lock lock = null;
        MucExtension muc = getMuc(room);
        if (muc != null) {
            try {
                lock = lockMap.get(room.intern());
                if (lock != null) lock.lock();

                if (muc.isJoined()) {
                    muc.leave();
                    log.debug("User with sessionId '" + sessionId + "' left MUC '" + room + "'");
                }
                else {
                    log.debug("Can't leave MUC with id '" + room + "' because user with sessionId '" + sessionId +
                            "' is not joined to it.");
                }
            } finally {
                muc.doFinalize();
                mucs.invalidate(room);
                if (lock != null) lock.unlock();
            }
        }

    }

    @Async
    public void processMessage(Chat chat, Message message) {
        doProcessPacket(message);
    }

    @Async
    public void processPacket(Packet packet) {
        doProcessPacket(packet);
    }

    public void doProcessPacket(Packet packet) {
        if (packets.get(packet.getPacketID()) == null) {
            if (packet instanceof Message && Message.Type.groupchat.equals(((Message) packet).getType())) {
                log.debug("Ignoring groupchat since we are already listening in XmppConnectionManager");
            }
            else {
                packets.put(packet.getPacketID(), true);
                xmppUtil.logPacket(packet);
                xmppUtil.sendPacket(sessionId, packet);
            }
        }
        else {
            log.trace("Ignoring packet with id '" + packet.getPacketID() + "' since this session has already received it.");
        }
    }

    public void entriesAdded(Collection<String> strings) {    }

    public void entriesUpdated(Collection<String> strings) {    }

    public void entriesDeleted(Collection<String> strings) {    }

    public void presenceChanged(Presence presence) {
        processPacket(presence);
    }

    public XMPPConnection getConnection() {
        return connection;
    }

    public List<Map<String, String>> getRosterPresences() {
        List<Map<String, String>> presences = new ArrayList<Map<String, String>>();
        for (RosterEntry rosterEntry : connection.getRoster().getEntries()) {
            Presence presence = connection.getRoster().getPresence(rosterEntry.getUser());
            Map<String, String> map = new HashMap<String, String>();
            map.put(XmppService.PACKET_TYPE_PARAM, Presence.class.getName());
            map.put(XmppService.PRESENCE_TYPE_PARAM, "" + presence.getType());
            map.put(XmppService.FROM_USER_PARAM, presence.getFrom());
            presences.add(map);
        }
        return presences;
    }


}
