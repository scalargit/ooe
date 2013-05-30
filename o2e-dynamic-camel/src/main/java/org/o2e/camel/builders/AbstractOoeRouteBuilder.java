package org.o2e.camel.builders;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.RouteDefinition;
import org.o2e.camel.RoutePropertyManager;
import org.o2e.mongo.pojo.ServiceSpecification;

import java.util.UUID;


/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/13/11
 * Time: 5:00 PM
 * To change this template use File | Settings | File Templates.
 */
public abstract class AbstractOoeRouteBuilder extends RouteBuilder {

    public static final String SERVICE_SPECIFICATION_ID_PROPERTY = "serviceSpecificationId";
    public static final String SERVICE_SPECIFICATION_PROPERTY = "serviceSpecification";
    public static final String ROUTE_LISTENERS_PROPERTY = "routeListeners";
    public static final String ROUTE_LISTENER_PROPERTY = "routeListener";
    public static final String BODY_CLASS_PROPERTY = "bodyClass";

    public enum Destination {cache, cometd}
    public enum Group {STATIC, SHARED, PRIVATE_PERSISTENT, PRIVATE_TRANSIENT}

    protected ServiceSpecification serviceSpecification;
    protected Destination destination;
    protected Group group;
    protected String listener;
    protected String routeId;
    protected RoutePropertyManager routePropertyManager;

    public AbstractOoeRouteBuilder(ServiceSpecification serviceSpecification, Destination destination,
                                   RoutePropertyManager routePropertyManager) {
        this.serviceSpecification = serviceSpecification;
        this.destination = destination;
        this.routePropertyManager = routePropertyManager;
    }

    /**
     * Sub-classes should implement this method rather than configure() for adding Routes
     */
    public abstract RouteDefinition doConfigure();

    @Override
    public void configure() throws Exception {
        // Add an intercept clause to every route. Must be performed BEFORE any routes are built.
//        intercept().process(this);
        interceptFrom().when(property(SERVICE_SPECIFICATION_PROPERTY).isNull()).process(new Processor() {
            public void process(Exchange exchange) throws Exception {
//                exchange.setProperty(SERVICE_SPECIFICATION_ID_PROPERTY, serviceSpecification.getId());
                exchange.setProperty(SERVICE_SPECIFICATION_PROPERTY, serviceSpecification);
            }
        });

        // Build routes according to sub-class
        RouteDefinition routeDefinition = doConfigure();
        if (Destination.cache.equals(destination)) {
            routeDefinition.
                    to("bean:dataCacheManager?method=onData&cache=true");
        }
        else {
            routePropertyManager.setProperty(getRouteId(), ROUTE_LISTENER_PROPERTY, listener);
            routeDefinition.
                    routePolicyRef("defaultRouteService").
                    setProperty(ROUTE_LISTENER_PROPERTY, constant(listener)).
                    to("bean:cometDeliveryBean?method=deliverSynch&cache=true");
        }
        routePropertyManager.setProperty(getRouteId(), SERVICE_SPECIFICATION_PROPERTY, serviceSpecification);
        routeDefinition.setGroup(group.name());
        routeDefinition.routeId(getRouteId());
    }

    public String getRouteId() {
        if (routeId == null) {
            routeId = Destination.cache.equals(destination) ? serviceSpecification.getId() : UUID.randomUUID().toString();
        }
        return routeId;
    }

    public void setRouteId(String routeId) {
        this.routeId = routeId;
    }

    public ServiceSpecification getServiceSpecification() {
        return serviceSpecification;
    }

    public void setServiceSpecification(ServiceSpecification serviceSpecification) {
        this.serviceSpecification = serviceSpecification;
    }

    public void setDestination(Destination destination) {
        this.destination = destination;
    }

    public void setListener(String listener) {
        this.listener = listener;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

}
