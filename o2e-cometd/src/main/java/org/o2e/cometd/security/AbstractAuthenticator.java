package org.o2e.cometd.security;

import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.server.DefaultSecurityPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;

/**
 * @author aaronsmith
 */
public abstract class AbstractAuthenticator extends DefaultSecurityPolicy implements ServerSession.RemoveListener {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    /**
     * Key for a session attribute containing the <code>org.springframework.security.core.Authentication</code> object
     * for a given session
     */
    public static final String AUTH_DATA = "AuthData";

    /**
     * @param server
     * @param session
     * @param message
     * @return Returns an AuthData object containing the user information or null if auth failed
     */
    public abstract Authentication verify(BayeuxServer server, ServerSession session, ServerMessage message);

    /**
     * @param server
     * @param session
     * @param message
     * @return True if auth succeeded. Otherwise false.
     */
    @Override
    public boolean canHandshake(BayeuxServer server, ServerSession session, ServerMessage message) {

        // Always allow local sessions
        if (session.isLocalSession()) {
            return true;
        }

        Authentication authentication = verify(server, session, message);
        if (authentication != null) {
            log.debug("Permitting handshake request for user '" + authentication.getName() + "'");
            // Link authentication data to the session
            session.setAttribute(AUTH_DATA, authentication);
            // Be notified when the session disappears
            session.addListener(this);
            return true;

        } else {
            log.debug("No authentication information provided, so denying handshake request.");
            return false;
        }
    }

    /**
     * @param session
     * @param expired
     */
    public void removed(ServerSession session, boolean expired) {
        // Unlink authentication data from the remote client
        session.removeAttribute(AUTH_DATA);
    }
}
