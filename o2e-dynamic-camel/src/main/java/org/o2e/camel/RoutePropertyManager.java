package org.o2e.camel;

import javax.inject.Named;
import javax.inject.Singleton;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 4/4/12
 * Time: 1:36 PM
 * This class manages a mapping of Camel Route IDs to a property map. It should be refactored out once Camel supports
 * setting Route properties directly from RouteBuilders.
 */
@Named
@Singleton
public class RoutePropertyManager {

    Map<String, Map<String, Object>> routeProperties = new ConcurrentHashMap<String, Map<String, Object>>();

    public void setProperty(String routeId, String key, Object value) {
        Map<String, Object> map = getMap(routeId);
        map.put(key, value);
        routeProperties.put(routeId, map);
    }

    public Object getProperty(String routeId, String key) {
        Map<String, Object> map = getMap(routeId);
        return map.get(key);
    }

    public void removeProperty(String routeId, String key) {
        Map<String, Object> map = getMap(routeId);
        map.remove(key);
    }

    public void removeRoute(String routeId) {
        routeProperties.remove(routeId);
    }

    private Map<String, Object> getMap(String routeId) {
        Map<String, Object> map = routeProperties.get(routeId);
        if (map == null) map = new ConcurrentHashMap<String, Object>();
        return map;
    }

}
