package org.o2e.cometd.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.ArrayList;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 3/29/11
 * Time: 12:38 PM
 *
 * Default {@link org.springframework.security.core.userdetails.UserDetailsService} for O2E which grants ADMIN
 * access to predefined users and UNANTICIPATED access to all other authenticated users.
 */
public class OoeUserDetailsService implements UserDetailsService {

    Logger log = LoggerFactory.getLogger(this.getClass());

    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException, DataAccessException {
        log.trace("Loading user '" + username + "'");
        return new OoeUser(username);
    }

}
