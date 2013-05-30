package org.o2e.camel.builders;

import org.apache.camel.model.RouteDefinition;
import org.o2e.camel.RoutePropertyManager;
import org.o2e.camel.processors.XmlToJsonProcessor;
import org.o2e.mongo.annotations.MappedByDataType;
import org.o2e.mongo.pojo.RssServiceSpecification;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 4/25/11
 * Time: 1:54 PM
 * To change this template use File | Settings | File Templates.
 */
@MappedByDataType("rss")
public class RssRouteBuilder extends AbstractOoeRouteBuilder {

    public RssRouteBuilder(RssServiceSpecification serviceSpecification, Destination destination,
                           RoutePropertyManager routePropertyManager) {
        super(serviceSpecification, destination, routePropertyManager);
    }

    @Override
    public RouteDefinition doConfigure() {
        RssServiceSpecification rssService = (RssServiceSpecification) serviceSpecification;
        int initialDelay = 0;

        String rssUri = rssService.getUri();
        try {
            for (Map.Entry<String, Object> entry : rssService.getRequestParameters().entrySet()) {
                rssUri += (rssUri.indexOf('?') < 0) ? "?" : "&";
                rssUri += entry.getKey() + "=" + URLEncoder.encode((String) entry.getValue(), "UTF-8");
            }
        } catch (UnsupportedEncodingException e) {
            log.warn("Error encoding RSS URL.");
        }

        return from("rss://" + rssUri + (rssUri.indexOf('?') < 0 ? "?" : "&") + "splitEntries=" + rssService.isSplitEntries() +
                "&consumer.initialDelay=" + initialDelay).
                marshal().string().
                process(new XmlToJsonProcessor());
    }

}
