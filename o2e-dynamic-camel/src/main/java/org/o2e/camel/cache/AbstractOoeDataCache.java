package org.o2e.camel.cache;

import org.apache.camel.Exchange;
import org.apache.camel.Message;
import org.o2e.camel.builders.AbstractOoeRouteBuilder;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.o2e.util.StringPool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/12/12
 * Time: 1:30 PM
 * To change this template use File | Settings | File Templates.
 */
public abstract class AbstractOoeDataCache implements OoeDataCache {

    @Value("${org.o2e.server.service.data.widgetRefreshInterval.seconds.minimum}")
    protected long minimumRefreshIntervalSeconds;

    @Autowired
    protected DataUpdateNotifier dataUpdateNotifier;

    @Autowired
    protected StringPool stringPool;

    public void onData(Exchange exchange) throws Exception {
        ServiceSpecification serviceSpecification = (ServiceSpecification) exchange.getProperty(
                AbstractOoeRouteBuilder.SERVICE_SPECIFICATION_PROPERTY);
        Message in = exchange.getIn();
        String json = stringPool.getCanonicalVersion(in.getBody(String.class));
        put(serviceSpecification.getId(), json);
    }

    public void put(String key, String value) throws Exception {
        doPut(key, value);
        dataUpdateNotifier.notifyListeners(key, value);
    }

    public abstract void doPut(String key, String value) throws Exception;

}
