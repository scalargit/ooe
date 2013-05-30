package org.o2e.cometd.security;

import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/3/11
 * Time: 2:22 PM
 * To change this template use File | Settings | File Templates.
 */
public class UserAssertionAuthenticator extends AbstractAuthenticator {

    @Override
    public Authentication verify(BayeuxServer server, ServerSession session, ServerMessage message) {
        if (session.isLocalSession()) return new UsernamePasswordAuthenticationToken("local-user", "fake");
        String username = (String) message.get("username");
        String password = (String) message.get("password");
        if (username != null && password != null) return new UsernamePasswordAuthenticationToken(username, password);
        else return null;
    }
    
}
