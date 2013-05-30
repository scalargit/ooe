package org.o2e.camel.cache;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/12/12
 * Time: 6:43 PM
 * To change this template use File | Settings | File Templates.
 */
public interface DataUpdateNotifier {

    public void notifyListeners(String key, String value) throws Exception;

}
