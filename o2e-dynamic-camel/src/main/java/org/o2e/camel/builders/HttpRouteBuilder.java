package org.o2e.camel.builders;

import org.apache.camel.builder.RouteBuilder;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/6/11
 * Time: 4:37 PM
 * To change this template use File | Settings | File Templates.
 */
public class HttpRouteBuilder extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        // No need to do anything here yet, but still need to implement method for superclass
    }

//    public List<RouteDefinition> getRouteDefinitions(String uri) {
//        List<RouteDefinition> routes = new ArrayList<RouteDefinition>();
//        routes.add(
//                from("rss://" + uri + "?splitEntries=" + splitEntries + "&consumer.initialDelay=" + initialDelay).
//                to("seda:bar?concurrentConsumers=" + concurrentConsumers).
//                routeId(uri));
//        routes.add(
//                from("seda:bar?concurrentConsumers=" + concurrentConsumers).
//                to("bean:cometDeliveryBean?method=deliver&cache=true").
//                routeId(uri + "-delivery"));
//        return routes;
//    }


}
