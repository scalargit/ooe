package org.o2e.camel;

import org.o2e.mongo.pojo.ServiceSpecification;

import java.util.Set;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 2/10/12
 * Time: 2:12 PM
 * To change this template use File | Settings | File Templates.
 */
public interface AsynchRouteMapper {

    /**
     * Associates the given asynchKey with the given serviceSpecificationId
     * @param asynchKey
     * @param serviceSpecification
     */
    public void addRouteMapping(String asynchKey, ServiceSpecification serviceSpecification);

    /**
     * Removes the mapping for the given asynchKey
     * @param asynchKey
     */
    public void removeRouteMapping(String asynchKey, ServiceSpecification serviceSpecification);

    /**
     * Returns the serviceSpecificationId associated with the given asynchKey
     * @param asynchKey
     * @return
     */
    public Set<ServiceSpecification> getServiceSpecifications(String asynchKey);

}
