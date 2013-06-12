package org.o2e.camel;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.camel.Exchange;
import org.apache.camel.Message;
import org.apache.camel.util.IOHelper;
import org.apache.commons.io.IOUtils;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.annotation.Session;
import org.json.JSONObject;
import org.o2e.camel.builders.AbstractOoeRouteBuilder;
import org.o2e.camel.builders.AsynchOoeRouteBuilder;
import org.o2e.camel.service.RouteService;
import org.o2e.cometd.service.DataService;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/6/11
 * Time: 4:26 PM
 * To change this template use File | Settings | File Templates.
 */
@Component
@org.cometd.annotation.Service("cometDeliveryBean")
public class CometDeliveryBean {

    Logger log = LoggerFactory.getLogger(this.getClass());

    @Inject
    RouteService routeService;

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    public void deliverSynch(Exchange exchange) {
        log.debug("Attempting to deliver message for 'from' Endpoint '" + exchange.getFromEndpoint() + "' to all " +
                "listening Cometd sessions.");
        String sessionId = (String) exchange.getProperty(AbstractOoeRouteBuilder.ROUTE_LISTENER_PROPERTY);
        Map<String, Object> params = new HashMap<String, Object>();
        params.put(DataService.ROUTE_ID_PARAM, exchange.getFromRouteId());
        routeService.sendToListener(sessionId, extractBody(exchange), params);
    }

    public void deliverAsynch(Exchange exchange) throws Exception {
        log.debug("Attempting to deliver message for 'from' Endpoint '" + exchange.getFromEndpoint() + "' to all " +
                "listening Cometd sessions.");
        Set<ServiceSpecification> serviceSpecifications = (Set<ServiceSpecification>) exchange.getProperty(
                AsynchOoeRouteBuilder.SERVICE_SPECIFICATIONS_PROPERTY);
        if (serviceSpecifications != null) {
            for (ServiceSpecification serviceSpecification : serviceSpecifications) {
                routeService.sendToListeners(serviceSpecification.getId(), extractBody(exchange));
            }
        } else log.warn("No ServiceSpecifications associated with this Route, so no deliveries can be sent.");
    }

	public void deliverError(Exchange exchange) throws Exception {
		Exception cause = exchange.getProperty(Exchange.EXCEPTION_CAUGHT, Exception.class);
		log.debug("Attempting to deliver error: " + cause.getMessage());
		ServiceSpecification serviceSpecification = (ServiceSpecification) exchange.getProperty(
				AsynchOoeRouteBuilder.SERVICE_SPECIFICATION_PROPERTY);
		if (serviceSpecification != null) {
			routeService.sendToListeners(serviceSpecification.getId(), "Error: " + cause.getClass());
			routeService.removeAllListeners(serviceSpecification);
		} else log.warn("No ServiceSpecifications associated with this Route, so no deliveries can be sent.");
	}

    /**
     * Attempts to extract the Exchange Body in the most appropriate way. Will look for the Exchange property
     * 'bodyClass'. If present, we will attempt to read the Exchange Body as an instance of that Class. Otherwise, we
     * will attempt to read it as a DBObject. If that fails
     *
     * @return
     */
    private Object extractBody(Exchange exchange) {
        Message in = exchange.getIn();
        Object body = null;
        Object bodyClass = exchange.getProperty(AbstractOoeRouteBuilder.BODY_CLASS_PROPERTY);
        if (bodyClass == null) {
            log.debug("Attempting to read Exchange Body as a DBObject...");
            body = in.getBody(DBObject.class);
            if (body == null) {
                log.debug("Attempting to read Exchange Body as a JSONObject...");
                body = in.getBody(JSONObject.class);
                if (body == null) {
                    log.debug("Attempting to read Exchange Body as a String...");
                    body = in.getBody(String.class);
                    if (body != null) {
                        log.debug("Attempting to parse Exchange Body String as a DBObject...");
                        DBObject dbObject = (DBObject) JSON.parse((String) body);
                        if (dbObject != null) body = dbObject;
                    } else {
                        throw new IllegalArgumentException("Could not extract Body from this exchange.");
                    }
                }
            }
        } else if (bodyClass instanceof Class) {
            log.debug("Attempting to read Exchange Body as a '" + bodyClass + "'...");
            body = in.getBody((Class) bodyClass);
        } else {
            throw new IllegalArgumentException("Exchange property '" + AbstractOoeRouteBuilder.BODY_CLASS_PROPERTY +
                    "' must be of type '" + Class.class + "'");
        }
        return body;
    }

}
