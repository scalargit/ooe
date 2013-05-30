package org.o2e.cometd.security;

import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 
 * 
 * @author aaronsmith
 */
public class X509Authenticator extends AbstractAuthenticator {

	/**
	 * 
	 * @param server
	 * @param session
	 * @param message
	 * @return AuthData
	 */
	@Override
	public Authentication verify(BayeuxServer server, ServerSession session, ServerMessage message) {
        return SecurityContextHolder.getContext().getAuthentication();
	}

}
