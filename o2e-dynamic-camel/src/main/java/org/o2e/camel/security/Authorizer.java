package org.o2e.camel.security;

import org.o2e.mongo.pojo.ServiceSpecification;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 9/30/11
 * Time: 4:32 PM
 * To change this template use File | Settings | File Templates.
 */
public interface Authorizer {

    public boolean authorize(String user, ServiceSpecification serviceSpecification);

}
