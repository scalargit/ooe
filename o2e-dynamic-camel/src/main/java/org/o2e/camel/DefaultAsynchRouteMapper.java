package org.o2e.camel;

import org.o2e.mongo.pojo.ServiceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Named;
import javax.inject.Singleton;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/6/11
 * Time: 10:57 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
public class DefaultAsynchRouteMapper implements AsynchRouteMapper {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    Map<String, Set<ServiceSpecification>> asynchRouteMap = new ConcurrentHashMap<String, Set<ServiceSpecification>>();

    public void addRouteMapping(String asynchKey, ServiceSpecification serviceSpecification) {
        log.debug("Mapping Asynch Key '" + asynchKey + "' to serviceSpecification with id '" +
                serviceSpecification.getId() + "'");
        Set<ServiceSpecification> specs = getServiceSpecificationSet(asynchKey);
        specs.add(serviceSpecification);
        asynchRouteMap.put(asynchKey, specs);
    }

    public void removeRouteMapping(String asynchKey, ServiceSpecification serviceSpecification) {
        log.debug("Removing Asynch Key '" + asynchKey + "' from map.");
        getServiceSpecificationSet(asynchKey).remove(serviceSpecification);
    }

    public Set<ServiceSpecification> getServiceSpecifications(String asynchKey) {
        return asynchRouteMap.get(asynchKey);
    }

    private Set<ServiceSpecification> getServiceSpecificationSet(String key) {
        Set<ServiceSpecification> serviceSpecifications = asynchRouteMap.get(key);
        if (serviceSpecifications == null) serviceSpecifications = new HashSet<ServiceSpecification>();
        return serviceSpecifications;
    }

}
