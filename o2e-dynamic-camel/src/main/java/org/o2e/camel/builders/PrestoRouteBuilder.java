package org.o2e.camel.builders;

import org.apache.camel.Exchange;
import org.apache.camel.model.RouteDefinition;
import org.apache.commons.httpclient.ProtocolException;
import org.apache.http.Header;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.impl.auth.BasicScheme;
import org.o2e.camel.RoutePropertyManager;
import org.o2e.camel.processors.PrestoRequestProcessor;
import org.o2e.camel.processors.PrestoResponseProcessor;
import org.o2e.cometd.security.filter.AkamaiFilter;
import org.o2e.mongo.annotations.MappedByDataType;
import org.o2e.mongo.pojo.PrestoServiceSpecification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/24/11
 * Time: 1:14 PM
 * To change this template use File | Settings | File Templates.
 */
@MappedByDataType("presto")
public class PrestoRouteBuilder extends AbstractOoeRouteBuilder {

    public PrestoRouteBuilder(PrestoServiceSpecification serviceSpecification, Destination destination,
                              RoutePropertyManager routePropertyManager) {
        super(serviceSpecification, destination, routePropertyManager);
    }

    @Override
    public RouteDefinition doConfigure() {
        // Poll this endpoint using the timer component and this ServiceSpecification's refresh interval
        // Associated this serviceSpecification with the exchange
        // Set the HTTP Method to POST
        // Run the PrestoRequestProcessor to create a proper POST Entity containing JSON request
        // Use http4 Component to invoke Presto, using the OoeHttpClientConfigurer for SSL support
        // Send the data payload to the DataCacheManager
        // Set this Route ID to this ServiceSpecification's ID
        PrestoServiceSpecification prestoService = (PrestoServiceSpecification) serviceSpecification;

        RouteDefinition routeDefinition = from("timer://" + UUID.randomUUID().toString() + "?period=" + prestoService.getRefreshIntervalSeconds() + "s").
                process(new PrestoRequestProcessor()).
//                setHeader(Exchange.HTTP_METHOD, constant(HttpMethods.POST)).
        setHeader(Exchange.HTTP_METHOD, constant(org.apache.camel.component.http.HttpMethods.POST));

        // Add HTTP Headers if they exist
        if (prestoService.getHttpHeaders() != null) {
            for (String key : prestoService.getHttpHeaders().keySet()) {
                String value = prestoService.getHttpHeaders().get(key);
                if (value != null) {
                    routeDefinition.setHeader(key, constant(value));
                }
            }
        }

        // Set required headers
        routeDefinition.setHeader("Connection", constant("close"));
        routeDefinition.setHeader("User-Agent", constant("Apache-HttpClient/4.x)"));
        routeDefinition.setHeader("Content-Type", constant("application/x-www-form-urlencoded; charset=UTF-8"));

        // If the ServiceSpecification this Route uses is not shared and assertUser is true, assert the current user to Presto
        if (!prestoService.isShared() && prestoService.isAssertUser()) {
            SecurityContext securityContext = SecurityContextHolder.getContext();
            Authentication authentication = securityContext.getAuthentication();
            if (authentication != null && authentication.getName() != null) {
                // AKAMAI_X509_USER_HEADER *must* start with "subjectDN=" (ask GCDS why...)
                String akamaiHeaderValue = "subjectDN=" + authentication.getName();
                routeDefinition.setHeader(AkamaiFilter.AKAMAI_X509_USER_HEADER, constant(akamaiHeaderValue));
            }
        }

        String params = "";
        String scheme;
        if (prestoService.isSecure()) {
            scheme = "https4";
            params += "?httpClientConfigurer=ooeHttpClientConfigurer";
        } else {
            scheme = "http4";
        }

        // Set pre-emptive authentication if this spec has a Presto username/password
        if (prestoService.getPrestoUsername() != null && prestoService.getPrestoPassword() != null) {
            UsernamePasswordCredentials creds = new UsernamePasswordCredentials(
                    prestoService.getPrestoUsername(), prestoService.getPrestoPassword());
            Header header = BasicScheme.authenticate(creds, "US-ASCII", false);
            routeDefinition.setHeader(header.getName(), constant(header.getValue()));
        }
        routeDefinition.
                to(scheme + "://" + prestoService.getPrestoHostname() + ":" + prestoService.getPrestoPort() +
                        "/presto/edge/api" + params).
                process(new PrestoResponseProcessor());
        routeDefinition.onException(ProtocolException.class).handled(true).logStackTrace(true).stop();
        return routeDefinition;
    }
}
