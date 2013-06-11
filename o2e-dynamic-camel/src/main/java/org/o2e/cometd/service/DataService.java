package org.o2e.cometd.service;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.camel.CamelContext;
import org.apache.camel.CamelContextAware;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.*;
import org.cometd.annotation.Configure;
import org.cometd.annotation.Listener;
import org.cometd.annotation.Session;
import org.o2e.camel.ServiceRegistry;
import org.o2e.camel.cache.OoeDataCache;
import org.o2e.camel.service.RouteService;
import org.o2e.cometd.security.AbstractAuthenticator;
import org.o2e.meter.PerformanceMeter;
import org.o2e.mongo.BeanValidator;
import org.o2e.mongo.ServiceRepository;
import org.o2e.mongo.WidgetMetadataRepository;
import org.o2e.mongo.cache.MetadataCache;
import org.o2e.mongo.pojo.PasswordProtectedService;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.o2e.mongo.pojo.WidgetMetadata;
import org.o2e.mongo.pojo.WidgetMetadataResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.security.core.Authentication;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import javax.validation.ConstraintViolation;
import java.util.ArrayList;
import java.util.Date;
import java.util.Map;
import java.util.Set;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 5/12/11
 * Time: 10:03 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
@org.cometd.annotation.Service("data")
public class DataService implements CamelContextAware {

    Logger log = LoggerFactory.getLogger(this.getClass());
    public static String SERVICE_SPECIFICATION_ID_PARAM = "serviceSpecificationId";
    public static String WIDGET_METADATA_ID_PARAM = "widgetMetadataId";
    public static String PASSWORD_PARAM = "password";
    public static String DEFAULT_WIDGETMETADATA_ID = "SYSTEM_DEFAULT";
    public static String ROUTE_ID_PARAM = "routeId";

    @Inject
    Authorizer authorizer;

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    MongoOperations mongoOperations;

    @Inject
    WidgetMetadataRepository widgetMetadataRepository;

    @Inject
    ServiceRepository serviceRepository;

    @Inject
    RouteService routeService;

    @Inject
    ServiceRegistry serviceRegistry;

    @Inject
    OoeDataCache dataCacheManager;

    @Inject
    CometDHelper cometDHelper;

    @Inject
    BeanValidator beanValidator;

    @Value("${org.o2e.server.service.data.widgetRefreshInterval.seconds.default}")
    long defaultWidgetRefreshInterval = 60;

    @Autowired
    PerformanceMeter performanceMeter;

    protected CamelContext camelContext;

    @Autowired
    protected MetadataCache metadataCache;

    @Configure("/service/data/**")
    protected void configure(ConfigurableServerChannel channel) {
        channel.addAuthorizer(authorizer);
        channel.setPersistent(true);
    }

    @Listener("/service/data/shared/listen")
    public void sharedListen(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, SERVICE_SPECIFICATION_ID_PARAM)) {
            Map<String, Object> data = message.getDataAsMap();
            String serviceSpecificationId = (String) data.get(SERVICE_SPECIFICATION_ID_PARAM);
            String widgetMetadataId = (String) data.get(WIDGET_METADATA_ID_PARAM);
            log.debug("Received listen request for ServiceSpecification with id '" + serviceSpecificationId +
                    "' and WidgetMetadata with id '" + widgetMetadataId + "'");

            // Use default WidgetMetadata if needed
            WidgetMetadata widgetMetadata = getWidgetMetadata(widgetMetadataId);
            widgetMetadataId = widgetMetadata.getId();

            try {
                // Look up the serviceSpecification by its ID, then cast it to the appropriate sub-class
                ServiceSpecification serviceSpecification = metadataCache.getServiceSpecification(serviceSpecificationId);
                if (serviceSpecification == null) {
                    String statusMessage = "No ServiceSpecification found for id '" + serviceSpecificationId + "'";
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            new BasicDBObject(), statusMessage, HttpStatus.SC_BAD_REQUEST);
                    log.warn(statusMessage);
                } else {
                    Class<? extends ServiceSpecification> serviceSubClass = serviceRegistry.getServiceSubClass(serviceSpecification);
                    if (serviceSubClass == null) {
                        String statusMessage = "Could not find a matching sub-class for serviceSpecification with ID '" +
                                serviceSpecificationId + "'";
                        cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                                new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
                        log.warn(statusMessage);
                        return;
                    }
                    ServiceSpecification asSubClass = serviceSubClass.cast(serviceSpecification);

                    // Is serviceSpecification password protected?
                    if (serviceSpecification instanceof PasswordProtectedService) {
                        String password = (String) data.get(PASSWORD_PARAM);
                        if (password == null) {
                            String statusMessage = "Attempting to listen to a password protected ServiceSpecification," +
                                    " but no 'password' parameter was supplied.";
                            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                                    new BasicDBObject(), statusMessage, HttpStatus.SC_BAD_REQUEST);
                            log.warn(statusMessage);
                            return;
                        } else {
                            PasswordProtectedService passwordProtectedService = (PasswordProtectedService) serviceSpecification;
                            passwordProtectedService.setPassword(password);
                        }
                    }

                    // Authorize user for this serviceSpecification and add as a listener if authorized
                    org.o2e.camel.security.Authorizer authorizer = serviceRegistry.getAuthorizer(asSubClass);
                    Authentication authentication = (Authentication) remote.getAttribute(AbstractAuthenticator.AUTH_DATA);
                    if (authorizer.authorize(authentication.getName(), asSubClass)) {
                        boolean routeAdded = routeService.addRouteListener(asSubClass, widgetMetadataId, remote.getId());
                        String statusMessage = "User '" + authentication.getName() + "' successfully added as a listener to " +
                                "ServiceSpecification '" + serviceSpecification.getId() + "'";
                        cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                                new BasicDBObject(serviceSpecification.asMap()), statusMessage, HttpStatus.SC_OK);
                        log.info(statusMessage);

                        // If cached data exists, send dataAvailable message
                        String json = dataCacheManager.get(serviceSpecificationId,
                                (long) widgetMetadata.getRefreshIntervalSeconds() * 1000);
                        if (json != null) {
                            log.trace("Found cached data already, so notifying listeners.");
                            routeService.notifyListeners(serviceSpecification.getId(), json.hashCode());
                        } else {
                            if (!routeAdded) {
                                log.debug("Route already exists for ServiceSpecification '" +
                                        serviceSpecification.getId() + "', but no cached data exists, so restarting.");
                                restartRoutes(remote, message, serviceSpecificationId, widgetMetadata);
                            }
                        }
                    } else {
                        String statusMessage = "User '" + authentication.getName() + "' not authorized for " +
                                "ServiceSpecification with id '" + serviceSpecification.getId() + "'";
                        cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                                new BasicDBObject(serviceSpecification.asMap()), statusMessage, HttpStatus.SC_UNAUTHORIZED);
                        log.warn(statusMessage);
                    }
                }
            } catch (Exception e) {
                String statusMessage = "Error adding listener to ServiceSpecification with id '" +
                        serviceSpecificationId + "' for session '" +
                        remote.getId() + "'";
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
                log.error(statusMessage, e);
            }
        }
    }

    @Listener("/service/data/private/listen")
    public void privatePersistentListen(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, SERVICE_SPECIFICATION_ID_PARAM)) {
            Map<String, Object> data = message.getDataAsMap();
            String serviceSpecificationId = (String) data.get(SERVICE_SPECIFICATION_ID_PARAM);
            log.debug("Received PRIVATE listen request for ServiceSpecification with id '" + serviceSpecificationId + "'");

            try {
                // Look up the serviceSpecification by its ID, then cast it to the appropriate sub-class
                ServiceSpecification serviceSpecification = metadataCache.getServiceSpecification(serviceSpecificationId);
                if (serviceSpecification == null) {
                    String statusMessage = "No ServiceSpecification found for id '" + serviceSpecificationId + "'";
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            new BasicDBObject(), statusMessage, HttpStatus.SC_BAD_REQUEST);
                    log.warn(statusMessage);
                } else {
                    Class<? extends ServiceSpecification> serviceSubClass = serviceRegistry.getServiceSubClass(serviceSpecification);
                    if (serviceSubClass == null) {
                        String statusMessage = "Could not find a matching sub-class for serviceSpecification with ID '" +
                                serviceSpecificationId + "'";
                        cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                                new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
                        log.warn(statusMessage);
                        return;
                    }
                    ServiceSpecification asSubClass = serviceSubClass.cast(serviceSpecification);
                    handlePrivateListen(remote, message, asSubClass, true);
                }
            } catch (Exception e) {
                String statusMessage = "Error adding listener to ServiceSpecification with id '" +
                        serviceSpecificationId + "' for session '" +
                        remote.getId() + "'";
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
                log.error(statusMessage, e);
            }
        }
    }

    @Listener("/service/data/transient/listen")
    public void privateTransientListen(ServerSession remote, ServerMessage message) {
        // Read object as a generic ServiceSpecification first
        BasicDBObject dbObject = new BasicDBObject(message.getDataAsMap());
        ServiceSpecification serviceSpecification = mongoOperations.getConverter().read(ServiceSpecification.class, dbObject);

        // Use generic ServiceSpecification to determine which sub-class to read dbObject into
        Class<? extends ServiceSpecification> serviceClass = serviceRegistry.getServiceSubClass(serviceSpecification);

        handlePrivateListen(remote, message, mongoOperations.getConverter().read(serviceClass, dbObject), false);
    }

    private void handlePrivateListen(ServerSession remote, ServerMessage message, ServiceSpecification asSubclassServiceSpecification, boolean persistent) {
        try {
            // Perform validation and report errors if any found; otherwise add route for transient ServiceSpecification
            Set<ConstraintViolation<ServiceSpecification>> violations = beanValidator.validate(asSubclassServiceSpecification);
            if (violations.isEmpty()) {
                // Create Camel Route
                String routeId = routeService.addPrivateRoute(asSubclassServiceSpecification, remote.getId(), persistent);
                BasicDBObject payload = new BasicDBObject();
                payload.put(ROUTE_ID_PARAM, routeId);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        payload, "Added direct route successfully.", HttpStatus.SC_OK);
            } else {
                String statusMessage = "";
                for (ConstraintViolation<ServiceSpecification> violation : violations) {
                    statusMessage += "Attribute " + violation.getPropertyPath() + " " + violation.getMessage() +
                            " (Invalid value was '" + violation.getInvalidValue() + "'). ";
                }
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_BAD_REQUEST);
            }
        } catch (Exception e) {
            String statusMessage = "Error while creating direct Camel Route.";
            log.error(statusMessage, e);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                    statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
        }
    }

    //TODO: Support custom unsubscribe actions (e.g. for JUM)

    @Listener("/service/data/cache/get")
    public void get(ServerSession remote, ServerMessage message) {
        // TODO: support fail-safe limits on data staleness/refresh rates
        if (cometDHelper.verifyParameter(serverSession, remote, message, SERVICE_SPECIFICATION_ID_PARAM)) {
            Map<String, Object> data = message.getDataAsMap();
            String serviceSpecificationId = (String) data.get(SERVICE_SPECIFICATION_ID_PARAM);
            String widgetMetadataId = (String) data.get(WIDGET_METADATA_ID_PARAM);

            log.debug("Received get request for ServiceSpecification with id '" + serviceSpecificationId +
                    "' and WidgetMetadata with id '" + widgetMetadataId + "'");

            // Use default WidgetMetadata if needed
            WidgetMetadata widgetMetadata = getWidgetMetadata(widgetMetadataId);

            // if data in cache is "new enough" based on refreshMillis, return cached data
            // else restart the route and return no data
            String json = dataCacheManager.get(serviceSpecificationId,
                    (long) widgetMetadata.getRefreshIntervalSeconds() * 1000);
            if (json != null) {
                String statusMessage = "Found data for ServiceSpecification with id '" + serviceSpecificationId + "'";
                //TODO: Add hook to filter data here before returning
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        (DBObject) JSON.parse(json), statusMessage, HttpStatus.SC_OK);
                log.debug(statusMessage);
                performanceMeter.acknowledge(json.hashCode(), remote.getId());
            } else {
                restartRoutes(remote, message, serviceSpecificationId, widgetMetadata);
            }
        }
    }

    @Listener("/service/data/shared/unlisten")
    public void sharedUnlisten(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, SERVICE_SPECIFICATION_ID_PARAM)) {
            Map<String, Object> data = message.getDataAsMap();
            String serviceSpecificationId = (String) data.get(SERVICE_SPECIFICATION_ID_PARAM);
            String widgetMetadataId = (String) data.get(WIDGET_METADATA_ID_PARAM);
            log.debug("Received unlisten request for ServiceSpecification with id '" + serviceSpecificationId +
                    "' and WidgetMetadata with id '" + widgetMetadataId + "'");

            // Use default WidgetMetadata if needed
            WidgetMetadata widgetMetadata = getWidgetMetadata(widgetMetadataId);
            widgetMetadataId = widgetMetadata.getId();

            try {
                ServiceSpecification serviceSpecification = metadataCache.getServiceSpecification(serviceSpecificationId);
                if (serviceSpecification == null) {
                    String statusMessage = "No ServiceSpecification found for id '" + serviceSpecificationId + "'";
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            new BasicDBObject(), statusMessage, HttpStatus.SC_BAD_REQUEST);
                    log.warn(statusMessage);
                } else {
                    routeService.removeRouteListener(serviceSpecification, widgetMetadataId, remote.getId());
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            new BasicDBObject(), "Session removed as listener from Service Specification '" +
                            serviceSpecificationId + "' and WidgetMetadata '" + widgetMetadataId + "'", HttpStatus.SC_OK);
                }
            } catch (Exception e) {
                String statusMessage = "Error removing listener to ServiceSpecification with id '" +
                        serviceSpecificationId + "' for session '" + remote.getId() + "'";
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
                log.error(statusMessage, e);
            }
        }
    }

    @Listener("/service/data/private/unlisten")
    public void privateUnlisten(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, ROUTE_ID_PARAM)) {
            Map<String, Object> data = message.getDataAsMap();
            String routeId = (String) data.get(ROUTE_ID_PARAM);
            log.debug("Received unlisten request for Route with id '" + routeId + "'");
            try {
                routeService.removeRoute(routeId, false);
                String statusMessage = "Removed Route with id '" + routeId + "'";
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error removing Route with id '" + routeId + "'";
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
                log.error(statusMessage, e);
            }
        }
    }

    private WidgetMetadata getWidgetMetadata(String widgetMetadataId) {
        if (widgetMetadataId != null) {
            try {
                WidgetMetadata widgetMetadata = metadataCache.getWidgetMetadata(widgetMetadataId);
                if (widgetMetadata != null) return widgetMetadata;
            } catch (Exception e) {
                log.debug("Did not find WidgetMetadata with id '" + widgetMetadataId + "'");
            }
        }
        return findDefaultWidgetMetadata();
    }


    private WidgetMetadata findDefaultWidgetMetadata() {
        WidgetMetadata widgetMetadata = metadataCache.getWidgetMetadata(DEFAULT_WIDGETMETADATA_ID);
        // If it doesn't exist, create it
        if (widgetMetadata == null) {
            log.info("Creating default WidgetMetadata...");
            widgetMetadata = new WidgetMetadata("DEFAULT_METADATA", "default", "type", null,
                    "hidden", "", "system", new Date().getTime(), "system", new Date().getTime(), false, "recordbreak",
                    defaultWidgetRefreshInterval, "clientConnector", null, "connectorAction", null, new ArrayList(),
                    new ArrayList<WidgetMetadataResponse>(), null);
            widgetMetadata.setId(DEFAULT_WIDGETMETADATA_ID);
            return widgetMetadataRepository.save(widgetMetadata);
        }
        return widgetMetadata;
    }

//    @Listener("/service/data/publish")
//	public void publish(ServerSession remote, ServerMessage message) {
//        Map<String, Object> data = message.getDataAsMap();
//        String serviceId = (String) data.get("serviceId");
////        String toUri = (String) data.get("toUri");
//        String toUri = "direct:" + serviceId;
//        log.debug("Received publish request to URI '" + toUri + "'");
//
//        // Add user as listener to routes for this serviceSpecification
//        listen(remote, message);
//
//        try {
//            String text = (String) data.get("text");
//            if (text == null) {
//                String statusMessage = "Must specify attribute 'text' for the destination to be published to.";
//                log.warn(statusMessage);
//                sendReply(remote, message, new BasicDBObject(), statusMessage, HttpStatus.SC_BAD_REQUEST);
//            }
//            else {
//                ProducerTemplate producerTemplate = camelContext.createProducerTemplate();
//                producerTemplate.sendBody(toUri, text);
//                String statusMessage = "Successfully published message '" + text + "' to URI '" + toUri + "'";
//                log.info(statusMessage);
//                sendReply(remote, message, new BasicDBObject(), statusMessage, HttpStatus.SC_OK);
//            }
//
//        } catch (Exception e) {
//            String statusMessage = "Error publishing to URI '" + toUri + "' for session '" + remote.getId() + "'";
//            log.error(statusMessage, e);
//            sendReply(remote, message, new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
//        }
//
//    }

    private void restartRoutes(ServerSession remote, ServerMessage message, String serviceSpecificationId,
                               WidgetMetadata widgetMetadata) {
        try {
            ServiceSpecification serviceSpecification = metadataCache.getServiceSpecification(serviceSpecificationId);
            routeService.restartRoutes(serviceSpecification, widgetMetadata);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                    new BasicDBObject(), "Did not find data for serviceSpecification with id '" +
                    serviceSpecificationId + "'", HttpStatus.SC_NOT_FOUND);

        } catch (Exception e) {
            String statusMessage = "Error restarting route for serviceSpecification with id '" +
                    serviceSpecificationId + "'";
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                    new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            log.error(statusMessage, e);
        }

    }

    public void setAuthorizer(Authorizer authorizer) {
        this.authorizer = authorizer;
    }

    public CamelContext getCamelContext() {
        return camelContext;
    }

    public void setCamelContext(CamelContext camelContext) {
        this.camelContext = camelContext;
    }

}
