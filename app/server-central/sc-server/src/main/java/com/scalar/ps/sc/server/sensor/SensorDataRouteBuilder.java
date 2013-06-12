package com.scalar.ps.sc.server.sensor;

import org.o2e.camel.RoutePropertyManager;
import org.o2e.camel.builders.RestRouteBuilder;
import org.o2e.camel.processors.RestRequestProcessor;
import org.o2e.camel.processors.RestResponseProcessor;
import org.o2e.mongo.annotations.MappedByDataType;
import org.o2e.mongo.pojo.RestServiceSpecification;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 6/11/13
 * Time: 3:46 PM
 * To change this template use File | Settings | File Templates.
 */
@MappedByDataType("sensor")
public class SensorDataRouteBuilder extends RestRouteBuilder {

	public SensorDataRouteBuilder(RestServiceSpecification serviceSpecification, Destination destination,
	                              RoutePropertyManager routePropertyManager, RestRequestProcessor restRequestProcessor,
	                              RestResponseProcessor restResponseProcessor) {
		super(serviceSpecification, destination, routePropertyManager, restRequestProcessor, restResponseProcessor);
	}

}
