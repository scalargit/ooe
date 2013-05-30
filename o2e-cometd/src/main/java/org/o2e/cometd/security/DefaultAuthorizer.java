package org.o2e.cometd.security;

import org.cometd.bayeux.ChannelId;
import org.cometd.bayeux.server.Authorizer;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 3/29/11
 * Time: 2:50 PM
 *
 * {@link org.cometd.bayeux.server.Authorizer} which grants access to any authenticated user
 */
public class DefaultAuthorizer implements Authorizer {

    Logger log = LoggerFactory.getLogger(this.getClass());

    public Result authorize(Operation operation, ChannelId channelId, ServerSession serverSession,
                            ServerMessage serverMessage) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            log.trace("Authorizing user '" + auth.getPrincipal() + "'");
            return Result.grant();
        }
        return Result.grant();
//        return Result.deny("No Principal in SecurityContext");
    }
}
