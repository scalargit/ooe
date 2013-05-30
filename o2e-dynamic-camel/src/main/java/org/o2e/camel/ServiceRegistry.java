package org.o2e.camel;

import org.o2e.camel.builders.AbstractOoeRouteBuilder;
import org.o2e.camel.security.Authorizer;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.springframework.context.ApplicationContext;

import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 2/10/12
 * Time: 1:59 PM
 * To change this template use File | Settings | File Templates.
 */
public interface ServiceRegistry {

    public Class<? extends ServiceSpecification> getServiceSubClass(ServiceSpecification serviceSpecification);

    public Class<AbstractOoeRouteBuilder> getRouteBuilder(ServiceSpecification serviceSpecification);

    public Authorizer getAuthorizer(ServiceSpecification serviceSpecification);

}
