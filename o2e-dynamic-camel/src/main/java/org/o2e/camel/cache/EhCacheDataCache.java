package org.o2e.camel.cache;

import net.sf.ehcache.Ehcache;
import net.sf.ehcache.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import java.util.Date;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/21/11
 * Time: 3:34 PM
 * To change this template use File | Settings | File Templates.
 */
public class EhCacheDataCache extends AbstractOoeDataCache {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    protected Ehcache cache;

    @Value("${org.o2e.server.service.data.widgetRefreshInterval.seconds.minimum}")
    long minimumRefreshIntervalSeconds;

    /**
     * @param serviceSpecificationId
     * @param millis - TTL in ms
     * @return cached JSON data for a given serviceSpecificationId if the data is not stale, based on the TTL passed in milliseconds.
     * Returns null otherwise.
     */
    public String get(String serviceSpecificationId, long millis) {
        if (minimumRefreshIntervalSeconds * 1000 > millis) millis = minimumRefreshIntervalSeconds;
        if (millis > 0) {
            Element element = cache.get(serviceSpecificationId);
            if (element != null && element.getValue() instanceof String) {
                log.trace("Found data for ServiceSpecification with id '" + serviceSpecificationId + "'. Checking if stale...");
                long lastUpdateTime = element.getLastUpdateTime() != 0 ? element.getLastUpdateTime() : element.getCreationTime();
                if (new Date().getTime() < (lastUpdateTime + millis)) {
                    log.trace("Found non-stale data in cache for ServiceSpecification with id '" + serviceSpecificationId + "'");
                    return (String) element.getValue();
                }
            }
        }
        log.debug("Did not find non-stale data in cache for ServiceSpecification with id '" + serviceSpecificationId + "'");
        return null;
    }

    @Override
    public void doPut(String serviceSpecificationId, String json) throws Exception {
        log.trace("Saving data to cache for ServiceSpecification with id '" + serviceSpecificationId + "': " + json);
        Element element = new Element(serviceSpecificationId, json);
        cache.put(element);
    }

    public void setCache(Ehcache cache) {
        this.cache = cache;
    }

    public void delete(String key) throws Exception {
        log.trace("Removing key '" + key + "' from cache.");
        cache.remove(key);
    }

}
