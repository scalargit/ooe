package org.o2e.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/21/12
 * Time: 11:31 AM
 * An alternative to String.intern() which allows us control over its memory usage
 */
@Component
public class StringPool {

    @Value("${org.o2e.util.stringPool.mapSize}")
    int mapSize = 10000;

    private ConcurrentMap<String, String> map = new ConcurrentHashMap<String, String>((int) (mapSize * 0.1));

    public String getCanonicalVersion(String str) {
        if (map.size() > mapSize) map.clear();
        String canon = map.putIfAbsent(str, str);
        return (canon == null) ? str : canon;
    }

}
