package org.o2e.camel.cache;

import org.o2e.camel.service.RouteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/12/12
 * Time: 6:44 PM
 * To change this template use File | Settings | File Templates.
 */
@Service
public class RouteServiceNotifier implements DataUpdateNotifier {

    Logger log = LoggerFactory.getLogger(this.getClass());

    @Autowired
    protected RouteService routeService;

    public void notifyListeners(String key, String value) throws Exception {
        log.trace("Notifying listeners for key '" + key + "', value '" + value + "'");
        // Notify each listener that data is available
        routeService.notifyListeners(key, value.hashCode());
    }

}
