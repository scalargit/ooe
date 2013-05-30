package org.o2e.camel.service;

import org.apache.camel.builder.RouteBuilder;
import org.eclipse.jetty.util.ConcurrentHashSet;

import java.io.Serializable;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/14/11
 * Time: 8:46 AM
 * To change this template use File | Settings | File Templates.
 */
public class RouteSet implements Serializable {

    private static final long serialVersionUID = -2672266605518093927L;

    /**
     * Key for this RouteSet, made up of the Service Specification ID and WidgetMetadata ID associated with this object.
     */
//    protected ServiceWidgetPair serviceWidgetPair;

    protected String serviceSpecificationId;

    /**
     * RouteBuilder associated with the ServiceSpecification represented by serviceSpecificationId.
     */
    protected RouteBuilder routeBuilder;

    protected Map<String, Set<String>> listenerMap = new ConcurrentHashMap<String, Set<String>>();

    /**
     * All listening Cometd sessions for this ServiceSpecification
     */
//    Set<String> listeners = new ConcurrentSkipListSet<String>();

    public RouteSet() { }

    public RouteSet(String serviceSpecificationId, RouteBuilder routeBuilder) {
        this.serviceSpecificationId = serviceSpecificationId;
        this.routeBuilder = routeBuilder;
    }

    public boolean addListener(String widgetMetadataId, String sessionId) {
        Set<String> widgetListeners = listenerMap.get(widgetMetadataId);
        if (widgetListeners == null) widgetListeners = new ConcurrentHashSet<String>();
        boolean ret = widgetListeners.add(sessionId);
        listenerMap.put(widgetMetadataId, widgetListeners);
        return ret;
    }

    public boolean removeListener(String widgetMetadataId, String sessionId) {
        Set<String> widgetListeners = listenerMap.get(widgetMetadataId);
        return widgetListeners != null && widgetListeners.remove(sessionId);
    }

    /**
     * Iterates through all WidgetMetadata instances tied to this Service Specification to determine if any client
     * sessions are listening to it.
     * @return
     */
    public boolean hasListeners() {
        for (String widgetMetadataId : listenerMap.keySet()) {
            Set<String> widgetListeners = listenerMap.get(widgetMetadataId);
            if (widgetListeners != null && !widgetListeners.isEmpty()) return true;
        }
        return false;
    }

    public String getServiceSpecificationId() {
        return serviceSpecificationId;
    }

    public void setServiceSpecificationId(String serviceSpecificationId) {
        this.serviceSpecificationId = serviceSpecificationId;
    }

    public RouteBuilder getRouteBuilder() {
        return routeBuilder;
    }

    public void setRouteBuilder(RouteBuilder routeBuilder) {
        this.routeBuilder = routeBuilder;
    }

    public Map<String, Set<String>> getListenerMap() {
        return listenerMap;
    }

    public void setListenerMap(Map<String, Set<String>> listenerMap) {
        this.listenerMap = listenerMap;
    }

    @Override
    public String toString() {
        return "RouteSet{" +
                "serviceSpecificationId='" + serviceSpecificationId + '\'' +
                ", routeBuilder=" + routeBuilder +
                ", listenerMap=" + listenerMap +
                '}';
    }

}
