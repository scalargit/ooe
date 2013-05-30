package org.o2e.camel.cache;

import org.apache.camel.Exchange;

import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/12/12
 * Time: 1:12 PM
 * To change this template use File | Settings | File Templates.
 */
public interface OoeDataCache {

    public String get(String key, long ttlMillis);

    public void put(String key, String value) throws Exception;

    public void delete(String key) throws Exception;

//    public void onData(Exchange exchange) throws Exception;

//    public String retrieve(Object payload);
//
//    public List<Class> supports();

}
