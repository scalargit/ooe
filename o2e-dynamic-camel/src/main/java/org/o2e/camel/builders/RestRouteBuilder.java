package org.o2e.camel.builders;

import org.apache.camel.Exchange;
import org.apache.camel.model.RouteDefinition;
import org.apache.commons.httpclient.ProtocolException;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.message.BasicNameValuePair;
import org.o2e.camel.RoutePropertyManager;
import org.o2e.camel.processors.AbstractOoeRequestProcessor;
import org.o2e.camel.processors.AbstractOoeResponseProcessor;
import org.o2e.camel.processors.RestRequestProcessor;
import org.o2e.camel.processors.RestResponseProcessor;
import org.o2e.mongo.annotations.MappedByDataType;
import org.o2e.mongo.pojo.RestServiceSpecification;

import java.util.Map;
import java.util.UUID;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 5/17/13
 * Time: 2:49 PM
 * To change this template use File | Settings | File Templates.
 */
@MappedByDataType("rest")
public class RestRouteBuilder extends AbstractOoeRouteBuilder {

	public RestRouteBuilder(RestServiceSpecification serviceSpecification, Destination destination,
	                        RoutePropertyManager routePropertyManager, AbstractOoeRequestProcessor restRequestProcessor,
	                        AbstractOoeResponseProcessor restResponseProcessor) {
		super(serviceSpecification, destination, routePropertyManager, restRequestProcessor, restResponseProcessor);
	}

	@Override
	public RouteDefinition doConfigure() {
		RestServiceSpecification restServiceSpecification = (RestServiceSpecification) serviceSpecification;

		RouteDefinition routeDefinition = from("timer://" + UUID.randomUUID().toString() + "?period=" +
				restServiceSpecification.getRefreshIntervalSeconds() + "s").
				setHeader(Exchange.HTTP_METHOD, constant(restServiceSpecification.getMethod()));
		if (requestProcessor != null) {
			routeDefinition.process(requestProcessor);
		}

		routeDefinition.setHeader("User-Agent", constant("Apache-HttpClient/4.x)"));

		// Add HTTP Headers if they exist
		if (restServiceSpecification.getHttpHeaders() != null) {
			for (String key : restServiceSpecification.getHttpHeaders().keySet()) {
				String value = restServiceSpecification.getHttpHeaders().get(key);
				if (value != null) {
					routeDefinition.setHeader(key, constant(value));
				}
			}
		}

		String url = BuilderUtil.toUrl(restServiceSpecification);

		return routeDefinition.to(url);
	}


}
