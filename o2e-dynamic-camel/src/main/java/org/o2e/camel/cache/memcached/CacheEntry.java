package org.o2e.camel.cache.memcached;

import java.io.Serializable;

/**
* Created by IntelliJ IDEA.
* User: Jeff
* Date: 11/14/12
* Time: 9:41 AM
* To change this template use File | Settings | File Templates.
*/
class CacheEntry implements Serializable {

    private static final long serialVersionUID = 8749043712139494039L;

    String key;
    String value;
    long lastUpdatedMillis;

    CacheEntry() { }

    CacheEntry(String key, String value, long lastUpdatedMillis) {
        this.key = key;
        this.value = value;
        this.lastUpdatedMillis = lastUpdatedMillis;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public long getLastUpdatedMillis() {
        return lastUpdatedMillis;
    }

    public void setLastUpdatedMillis(long lastUpdatedMillis) {
        this.lastUpdatedMillis = lastUpdatedMillis;
    }

}
