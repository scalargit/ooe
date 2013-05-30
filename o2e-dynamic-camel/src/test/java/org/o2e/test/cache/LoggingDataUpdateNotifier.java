package org.o2e.test.cache;

import org.o2e.camel.cache.DataUpdateNotifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/12/12
 * Time: 6:48 PM
 * To change this template use File | Settings | File Templates.
 */
public class LoggingDataUpdateNotifier implements DataUpdateNotifier {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    public void notifyListeners(String key, String value) throws Exception {
        log.trace("Updating key '" + key + "' with value '" + value + "'");
    }
}
