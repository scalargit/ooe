package org.o2e.xmpp;

import com.google.common.cache.CacheLoader;
import org.jivesoftware.smack.PacketListener;
import org.jivesoftware.smack.XMPPException;
import org.jivesoftware.smackx.muc.MultiUserChat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/14/11
 * Time: 1:20 PM
 * To change this template use File | Settings | File Templates.
 */
public class XmppMucCacheLoader extends CacheLoader<String, MucExtension> {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    protected XmppSession xmppSession;

    XmppMucCacheLoader(XmppSession xmppSession) {
        this.xmppSession = xmppSession;
    }

    @Override
    public MucExtension load(String room) throws XMPPException {
        log.debug("Creating new MUC from user '" + xmppSession.getConnection().getUser() + "' to room '" +
                room + "'");
        return new MucExtension(xmppSession.getConnection(), room);
    }

}
