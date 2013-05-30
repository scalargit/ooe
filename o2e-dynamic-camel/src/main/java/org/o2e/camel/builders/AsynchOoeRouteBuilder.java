package org.o2e.camel.builders;

import org.o2e.camel.RoutePropertyManager;
import org.o2e.mongo.pojo.ServiceSpecification;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/6/11
 * Time: 11:38 AM
 * To change this template use File | Settings | File Templates.
 */
public abstract class AsynchOoeRouteBuilder extends AbstractOoeRouteBuilder {

    public static final String SERVICE_SPECIFICATIONS_PROPERTY = "serviceSpecifications";

    protected AsynchOoeRouteBuilder(ServiceSpecification serviceSpecification, Destination destination,
                                    RoutePropertyManager routePropertyManager) {
        super(serviceSpecification, destination, routePropertyManager);
    }

    public abstract String getAsynchKey();

}
