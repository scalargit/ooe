package org.o2e.xmpp;

import org.jivesoftware.smack.Connection;
import org.jivesoftware.smackx.muc.MultiUserChat;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 8/8/12
 * Time: 3:30 PM
 * Extending Smack's MultiUserChat class in order to be able to explicitly call finalize(), which will remove all
 * packet listeners from the object.
 */
public class MucExtension extends MultiUserChat {

    public MucExtension(Connection connection, String room) {
        super(connection, room);
    }

    public void doFinalize() throws Throwable {
        this.finalize();
    }

}
