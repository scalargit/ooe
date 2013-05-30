package org.o2e.camel;

import org.o2e.mongo.annotations.MappedByDataType;
import org.o2e.camel.builders.AbstractOoeRouteBuilder;
import org.o2e.camel.security.Authorizer;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/18/11
 * Time: 1:34 PM
 * To change this template use File | Settings | File Templates.
 */
public class DefaultServiceRegistry implements ApplicationContextAware, ServiceRegistry {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    Map<String, Class<ServiceSpecification>> serviceRegistry = new ConcurrentHashMap<String, Class<ServiceSpecification>>();
    Map<String, Class<AbstractOoeRouteBuilder>> routeBuilderRegistry = new ConcurrentHashMap<String, Class<AbstractOoeRouteBuilder>>();
    Map<String, Authorizer> authorizerRegistry = new ConcurrentHashMap<String, Authorizer>();

    protected ApplicationContext applicationContext;
    protected List<String> packages;
    protected Authorizer defaultAuthorizer;

    @PostConstruct
    public void init() {
        log.info("Initializing DefaultServiceRegistry...");
        scanClassPath();
        scanBeans();
    }

    private void scanClassPath() {
        log.info("Scanning classpath to build registries...");
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(MappedByDataType.class));
        for (String basePackage : packages) {
            for (BeanDefinition bd : scanner.findCandidateComponents(basePackage)) {
                try {
                    Class clazz = Class.forName(bd.getBeanClassName());
                    log.trace("Looking for '" + MappedByDataType.class + "' annotation on class '" +
                            clazz.getCanonicalName() + "'");
                    MappedByDataType annotation = (MappedByDataType) clazz.getAnnotation(MappedByDataType.class);
                    if (annotation != null) {
                        if (annotation.value() != null) {
                            if (ServiceSpecification.class.isAssignableFrom(clazz)) {
                                log.debug("Mapping '" + annotation.value() + "' to ServiceSpecification '" +
                                        clazz.getCanonicalName() + "'");
                                serviceRegistry.put(annotation.value(), clazz);
                            }
                            else if (AbstractOoeRouteBuilder.class.isAssignableFrom(clazz)) {
                                log.debug("Mapping '" + annotation.value() + "' to RouteBuilder '" +
                                        clazz.getCanonicalName() + "'");
                                routeBuilderRegistry.put(annotation.value(), clazz);
                            }
                        }
                    }
                } catch (ClassNotFoundException e) {
                    log.error("Could not load class with name '" + bd.getBeanClassName() + "'", e);
                }
            }
        }
    }

    private void scanBeans() {
        log.info("Scanning bean instances to build registries...");
        Map<String, Object> beans = applicationContext.getBeansWithAnnotation(MappedByDataType.class);
        for (Map.Entry<String, Object> entry : beans.entrySet()) {
            String name = entry.getKey();
            Object bean = entry.getValue();
            log.trace("Looking for '" + MappedByDataType.class + "' annotation on class '" + bean.getClass() + "'");
            MappedByDataType annotation = bean.getClass().getAnnotation(MappedByDataType.class);
            if (bean instanceof Authorizer && annotation != null) {
                if (authorizerRegistry.get(annotation.value()) != null)
                    log.warn("Found multiple Authorizers specified for data type '" + annotation.value() + "'");
                else {
                    log.debug("Mapping '" + annotation.value() + "' to bean '" +
                            bean.getClass().getCanonicalName() + "'");
                    authorizerRegistry.put(annotation.value(), (Authorizer) bean);
                }
            }
        }
    }

    public Class<? extends ServiceSpecification> getServiceSubClass(ServiceSpecification serviceSpecification) {
        if (serviceSpecification == null || serviceSpecification.getDataType() == null)
            throw new IllegalArgumentException("ServiceSpecificastion cannot be null.");
        else return serviceRegistry.get(serviceSpecification.getDataType());
    }

    public Class<AbstractOoeRouteBuilder> getRouteBuilder(ServiceSpecification serviceSpecification) {
        return routeBuilderRegistry.get(serviceSpecification.getDataType());
    }

    public Authorizer getAuthorizer(ServiceSpecification serviceSpecification) {
        Authorizer authorizer = authorizerRegistry.get(serviceSpecification.getDataType());
        return authorizer != null ? authorizer : defaultAuthorizer;
    }

    public void setApplicationContext(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    public void setAuthorizerRegistry(Map<String, Authorizer> authorizerRegistry) {
        this.authorizerRegistry = authorizerRegistry;
    }

    public void setPackages(List<String> packages) {
        this.packages = packages;
    }

    public void setDefaultAuthorizer(Authorizer defaultAuthorizer) {
        this.defaultAuthorizer = defaultAuthorizer;
    }
}
