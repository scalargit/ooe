package org.o2e.cometd.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.ArrayList;
import java.util.Collection;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/24/12
 * Time: 12:55 PM
 * To change this template use File | Settings | File Templates.
 */
public class OoeUser extends User {

    private static final long serialVersionUID = -6172697594798961501L;

    boolean canHandshake = true;
    int authStatus = AUTH_STATUS_OK;
    String authStatusMessage = AUTH_STATUS_MESSAGE_SUCCESSFUL;

    public static final int AUTH_STATUS_OK = 200;
    public static final int AUTH_STATUS_ERROR = 500;
    public static final int AUTH_STATUS_UNAUTHORIZED = 403;

    public static final String AUTH_STATUS_MESSAGE_SUCCESSFUL = "Authentication successful.";
    public static final String AUTH_STATUS_MESSAGE_UNAUTHORIZED = "Authentication failed: Unauthorized.";
    public static final String AUTH_STATUS_MESSAGE_ERROR = "Authentication failed: Unknown error.";

    public OoeUser(String username) {
        super(username, "fake", new ArrayList<GrantedAuthority>());
    }

    public OoeUser(String username, String password, Collection<? extends GrantedAuthority> authorities,
                   boolean canHandshake, int authStatus, String authStatusMessage) {
        super(username, password, authorities);
        this.canHandshake = canHandshake;
        this.authStatus = authStatus;
        this.authStatusMessage = authStatusMessage;
    }

    public OoeUser(String username, String password, boolean enabled, boolean accountNonExpired,
                   boolean credentialsNonExpired, boolean accountNonLocked,
                   Collection<? extends GrantedAuthority> authorities, boolean canHandshake,
                   int authStatus, String authStatusMessage) {
        super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities);
        this.canHandshake = canHandshake;
        this.authStatus = authStatus;
        this.authStatusMessage = authStatusMessage;
    }

    public boolean isCanHandshake() {
        return canHandshake;
    }

    public void setCanHandshake(boolean canHandshake) {
        this.canHandshake = canHandshake;
    }

    public int getAuthStatus() {
        return authStatus;
    }

    public void setAuthStatus(int authStatus) {
        this.authStatus = authStatus;
    }

    public String getAuthStatusMessage() {
        return authStatusMessage;
    }

    public void setAuthStatusMessage(String authStatusMessage) {
        this.authStatusMessage = authStatusMessage;
    }
}
