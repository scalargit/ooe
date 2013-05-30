package org.o2e.cometd.security.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.GenericFilterBean;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.StringTokenizer;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/7/11
 * Time: 4:37 PM
 * To change this template use File | Settings | File Templates.
 */
public class AkamaiFilter extends GenericFilterBean {

    Logger log = LoggerFactory.getLogger(this.getClass());

    public static final String AKAMAI_X509_USER_HEADER = "UserX509";

    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) servletRequest;
        String x509Header = req.getHeader(AKAMAI_X509_USER_HEADER);
        if (x509Header != null) {
            log.debug("Found Akamai Header '" + AKAMAI_X509_USER_HEADER + "': '" + x509Header + "'");
            String userDn = parseX509Header(x509Header);
            log.debug("Parsed subject DN from Akamai Header as '" + userDn + "'");
            UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(userDn, "fakepw");
            SecurityContextHolder.getContext().setAuthentication(token);
        }
        filterChain.doFilter(servletRequest, servletResponse);
    }

	 private static String fixX509DN(String dn) {
		String retString = "";
		if (!dn.contains("/") && dn.startsWith("CN=")) {
			retString = dn;
		} else {
			String[] tokens = dn.split("/");
			for (int i=tokens.length-1;i>0;i--) {
				retString += tokens[i]+", ";
			}
			retString = retString.substring(0,retString.length()-2);
		}
		return retString;
	 }

   private String parseX509Header(String x509Header) {
       if (x509Header != null) {
           StringTokenizer lex = new StringTokenizer(x509Header,";");
           if(lex.hasMoreTokens()){
               String first = lex.nextToken();  //grabs subjectDN=/C=US.....
               String dn = first.substring("subjectDN=".length()); //strips off subjectDN=
               return fixX509DN( dn );
           }
       }
       log.error("Could not parse DN out of Akamai Header '" + AKAMAI_X509_USER_HEADER + "'");
       return null;
   }
    
}
