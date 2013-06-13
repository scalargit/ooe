package org.o2e.xmpp;

import com.google.common.cache.CacheLoader;
import org.jivesoftware.smack.Chat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
* Created by IntelliJ IDEA.
* User: Jeff
* Date: 11/14/11
* Time: 1:19 PM
* To change this template use File | Settings | File Templates.
*/
class XmppChatCacheLoader extends CacheLoader<String, Chat> {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    protected XmppSession xmppSession;

    XmppChatCacheLoader(XmppSession xmppSession) {
        this.xmppSession = xmppSession;
    }

    @Override
    public Chat load(String user) {
        log.debug("Creating new chat from user '" + xmppSession.getConnection().getUser() + "' to user '" + user + "'");
        return xmppSession.getConnection().getChatManager().createChat(user, xmppSession);
    }
}
