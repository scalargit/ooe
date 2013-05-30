package org.o2e.cometd.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Named;
import javax.inject.Singleton;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/15/11
 * Time: 5:31 PM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
public class FilterHelper {

    final Logger log = LoggerFactory.getLogger(this.getClass());
    
    public Map filterMap(Map map, List<String> filters) {
        log.debug("Applying filters of size " + filters.size() + " to map of size " + map.size());
        Map<String, Object> flatMap = new HashMap<String, Object>();
        for (String filter : filters) {
            flatMap.put(filter, getValue(map, filter));
        }

        Map<String, Object> newMap = new HashMap<String, Object>();
        for (Map.Entry entry : flatMap.entrySet()) {
            if (entry.getValue() != null) addValue(newMap, (String) entry.getKey(), entry.getValue());
        }
        return newMap;
    }

    private void addValue(Map map, String filter, Object value) {
        if (filter != null && filter.length() > 0) {
            if (filter.contains(".")) {
                String first = filter.substring(0, filter.indexOf('.'));
                if (map.get(first) == null) map.put(first, new HashMap());
                int index = filter.indexOf('.') + 1;
                if (index < filter.length()) {
                    String remainder = filter.substring(index);
                    addValue((Map) map.get(first), remainder, value);
                }
            }
            else if (value != null) map.put(filter, value);
        }
    }

    private Object getValue(Map map, String filter) {
        if (filter != null && filter.length() > 0) {
            if (filter.contains(".")) {
                String first = filter.substring(0, filter.indexOf('.'));
                Object obj = map.get(first);
                if (obj != null) {
                    if (obj instanceof Map) {
                        int index = filter.indexOf('.') + 1;
                        if (index < filter.length()) {
                            String remainder = filter.substring(index);
                            return getValue((Map) obj, remainder);
                        }
                    }
                }
            }
            else return map.get(filter);
        }
        return null;
    }

}
