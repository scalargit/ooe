package org.o2e.cometd.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.filter.GenericFilterBean;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import java.io.IOException;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 3/24/11
 * Time: 5:19 PM
 *
 * Security Filter which simply logs user information for authenticated users
 */
public class SecurityLogFilter extends GenericFilterBean {

    Logger log = LoggerFactory.getLogger(this.getClass());

    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        Authentication authentication = getAuthentication();
        if (authentication != null) {
            UserDetails userDetails = UserDetails.class.cast(authentication.getPrincipal());
            log.info("Authenticated User: " + userDetails.getUsername());
        }
        else {
            log.info("Not authenticated.");
        }
    }

    private Authentication getAuthentication() {
        Authentication authentication = null;
        SecurityContext securityContext = SecurityContextHolder.getContext();
        if (securityContext != null) authentication = securityContext.getAuthentication();
        return authentication;
    }
}
