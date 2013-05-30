package org.o2e.camel.cache.memcached;

import net.spy.memcached.MemcachedClient;
import org.o2e.camel.cache.AbstractOoeDataCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Date;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/13/12
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */
public class MemcachedDataCache extends AbstractOoeDataCache {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Autowired
    MemcachedClient memcachedClient;

    @Override
    public void doPut(String key, String value) throws Exception {
        log.trace("Writing mapping '" + key + "' -> '" + value + "' to cache.");
        memcachedClient.set(key, 0, new CacheEntry(key, value, new Date().getTime()));
    }

    public String get(String key, long ttlMillis) {
        if (minimumRefreshIntervalSeconds * 1000 > ttlMillis) ttlMillis = minimumRefreshIntervalSeconds;
        CacheEntry cacheEntry = (CacheEntry) memcachedClient.get(key);
        if (cacheEntry != null) {
            if (new Date().getTime() < (cacheEntry.getLastUpdatedMillis() + ttlMillis)) {
                log.trace("Found non-stale data in cache for ServiceSpecification with id '" + key + "'");
                return cacheEntry.getValue();
            }
        }
        return null;
    }

    public void delete(String key) {
        memcachedClient.delete(key);
    }

}
