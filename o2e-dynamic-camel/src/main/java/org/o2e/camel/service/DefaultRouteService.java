package org.o2e.camel.service;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.mongodb.BasicDBObject;
import org.apache.camel.CamelContext;
import org.apache.camel.CamelContextAware;
import org.apache.camel.Exchange;
import org.apache.camel.Route;
import org.apache.camel.impl.RoutePolicySupport;
import org.apache.camel.model.RouteDefinition;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.java.annotation.Session;
import org.o2e.camel.AsynchRouteMapper;
import org.o2e.camel.RoutePropertyManager;
import org.o2e.camel.ServiceRegistry;
import org.o2e.camel.builders.AbstractOoeRouteBuilder;
import org.o2e.camel.builders.AsynchOoeRouteBuilder;
import org.o2e.cometd.service.CometDHelper;
import org.o2e.cometd.service.DataService;
import org.o2e.meter.PerformanceMeter;
import org.o2e.mongo.ServiceRepository;
import org.o2e.mongo.cache.MetadataCache;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.o2e.mongo.pojo.WidgetMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskExecutor;
import org.springframework.jmx.export.annotation.ManagedOperation;
import org.springframework.jmx.export.annotation.ManagedOperationParameter;
import org.springframework.jmx.export.annotation.ManagedOperationParameters;
import org.springframework.jmx.export.annotation.ManagedResource;
import org.springframework.scheduling.annotation.Scheduled;

import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 5/2/11
 * Time: 11:47 AM
 * To change this template use File | Settings | File Templates.
 */
//@org.springframework.stereotype.Service
@Named
@Singleton
@org.cometd.java.annotation.Service("routeService")
@ManagedResource
public class DefaultRouteService extends RoutePolicySupport implements CamelContextAware, RouteService {

    public static final String DATA_AVAILABLE_PARAM = "dataAvailable";
    public static final String HASHCODE_PARAM = "hashcode";
    public static final String PAYLOAD_PARAM = "payload";

    final Logger log = LoggerFactory.getLogger(this.getClass());

    protected com.google.common.cache.LoadingCache<ServiceSpecification, RouteSet> routeCache;

    protected CamelContext camelContext;

    protected com.google.common.cache.LoadingCache<String, Lock> lockMap;

    protected Map<String, Date> transientRoutes = new ConcurrentHashMap<String, Date>();

    @Inject
    ServiceRegistry serviceRegistry;

    @Inject
    AsynchRouteMapper asynchRouteMapper;

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    ServiceRepository serviceRepository;

    @Value("${org.o2e.server.service.data.widgetRefreshInterval.seconds.minimum}")
    long minimumRefreshIntervalSeconds;

    @Value("${org.o2e.server.service.data.privateRoute.ttl.seconds}")
    long privateRouteTtl;

    @Inject
    CometDHelper cometDHelper;

    @Inject
    @Qualifier("camelTaskExecutor")
    TaskExecutor camelTaskExecutor;

    @Inject
    @Qualifier("cometTaskExecutor")
    TaskExecutor cometTaskExecutor;

    @Inject
    RoutePropertyManager routePropertyManager;

    @Autowired
    PerformanceMeter performanceMeter;

    @Autowired
    MessageQueue messageQueue;

    @Value("${org.o2e.server.service.data.messageQueue.enabled}")
    boolean messageQueueEnabled;

    @Autowired
    protected MetadataCache metadataCache;

    @PostConstruct
    public void init() {
        lockMap = CacheBuilder.newBuilder()
                .concurrencyLevel(1)
                .weakValues()
                .build(
                        new CacheLoader<String, Lock>() {
                            public Lock load(String key) {
                                return new ReentrantLock();
                            }
                        });

        routeCache = CacheBuilder.newBuilder()
                .concurrencyLevel(1)
                .build(
                        new CacheLoader<ServiceSpecification, RouteSet>() {
                            public RouteSet load(ServiceSpecification serviceSpecification) {
                                log.debug("Constructing new RouteSet...");
                                AbstractOoeRouteBuilder routeBuilder = null;
                                try {
                                    routeBuilder = constructRouteBuilder(serviceSpecification, AbstractOoeRouteBuilder.Destination.cache);
                                    routeBuilder.setGroup(AbstractOoeRouteBuilder.Group.SHARED);
                                } catch (Exception e) {
                                    log.warn("Error constructing route building for ServiceSpecification '" +
                                            serviceSpecification + "'", e);
                                }
                                if (routeBuilder instanceof AsynchOoeRouteBuilder) {
                                    // This mapping allows us to connect data arriving asynchronously with the ServiceSpecification and
                                    // WidgetMetadata it's associated with
                                    asynchRouteMapper.addRouteMapping(((AsynchOoeRouteBuilder) routeBuilder).getAsynchKey(),
                                            serviceSpecification);
                                }
                                return new RouteSet(serviceSpecification.getId(), routeBuilder);
                            }
                        });
    }

    public boolean addRouteListener(ServiceSpecification serviceSpecification, String widgetMetadataId,
                                    String sessionId) throws Exception {
        log.info("Received request to add a listener with sessionId '" + sessionId + "' to serviceSpecificationId '" +
                serviceSpecification.getId() + "'");
        Lock lock = null;
        try {
            boolean routeAdded = false;
            lock = lockMap.get(serviceSpecification.getId().intern());
            if (lock != null) lock.lock();
            RouteSet routeSet = routeCache.get(serviceSpecification);

            // If no other sessions are listening, create a new Camel Route
            if (!routeSet.hasListeners()) {
                log.debug("No listeners found for serviceSpecificationId '" + serviceSpecification.getId() +
                        "', so adding a new route.");
                camelContext.addRoutes(routeSet.getRouteBuilder());
                routeAdded = true;
            }
            routeSet.addListener(widgetMetadataId, sessionId);
            return routeAdded;
        } finally {
            if (lock != null) lock.unlock();
        }
    }

    public boolean removeRouteListener(ServiceSpecification serviceSpecification, String widgetMetadataId,
                                       String sessionId) throws Exception {
        log.info("Attempting to remove a listener with sessionId '" + sessionId + "' to serviceSpecificationId '" +
                serviceSpecification.getId() + "'");
        Lock lock = null;
        try {
            lock = lockMap.get(serviceSpecification.getId().intern());
            if (lock != null) lock.lock();
            boolean routeRemoved = false;
            RouteSet routeSet = routeCache.get(serviceSpecification);
            if (routeSet != null) {
                routeSet.removeListener(widgetMetadataId, sessionId);
                // Remove Camel Route if no sessions are listening
                if (!routeSet.hasListeners()) {
                    log.debug("No listeners found for route with serviceSpecificationId '" +
                            serviceSpecification.getId() + "', so removing.");
                    // TODO: call per-serviceSpecification shutdown/unsubscribe method here. RSS would be a no-op, but JUM would issue an unsubscribe call
                    removeRoute(serviceSpecification.getId(), false);
                    routeCache.invalidate(serviceSpecification);
                    if (routeSet.getRouteBuilder() instanceof AsynchOoeRouteBuilder) {
                        asynchRouteMapper.removeRouteMapping(
                                ((AsynchOoeRouteBuilder) routeSet.getRouteBuilder()).getAsynchKey(),
                                serviceSpecification);
                    }
                    routeRemoved = true;
                }
            } else log.warn("No RouteSet found for serviceSpecificationId '" + serviceSpecification.getId() + "'");
            return routeRemoved;
        } finally {
            if (lock != null) lock.unlock();
        }
    }

    @Scheduled(fixedDelay = 60000)
    public void garbageCollect() {
        // Make a copy of the Route array since we will modify the original
        List<Route> routes = new ArrayList<Route>(camelContext.getRoutes());
        log.debug("Running Garbage Collection on " + routes.size() + " Route(s)...");
        for (Route route : routes) {
            RouteDefinition routeDefinition = camelContext.getRouteDefinition(route.getId());
            if (routeDefinition != null) {
                String group = routeDefinition.getGroup();
                if (AbstractOoeRouteBuilder.Group.SHARED.name().equals(group)) gcSharedRoute(route);
                else if (AbstractOoeRouteBuilder.Group.PRIVATE_PERSISTENT.name().equals(group))
                    gcPrivatePersistentRoute(route);
                else if (AbstractOoeRouteBuilder.Group.PRIVATE_TRANSIENT.name().equals(group))
                    gcPrivateTransientRoute(route);
                else log.trace("Route with id '" + route.getId() + "' has group '" + group + "', so ignoring.");
            }
        }
    }

    private void gcSharedRoute(Route route) {
        ServiceSpecification serviceSpecification = metadataCache.getServiceSpecification(route.getId());
//        ServiceSpecification serviceSpecification = (ServiceSpecification) route.getProperties().get(
//                AbstractOoeRouteBuilder.SERVICE_SPECIFICATION_PROPERTY);
//        ServiceSpecification serviceSpecification = (ServiceSpecification) routePropertyManager.getProperty(
//                route.getId(), AbstractOoeRouteBuilder.SERVICE_SPECIFICATION_PROPERTY);
        if (serviceSpecification != null) {
            log.trace("Found a matching ServiceSpecification for Shared Route with id '" +
                    route.getId() + "'.");
            Lock lock = null;
            try {
                lock = lockMap.get(serviceSpecification.getId().intern());
                if (lock != null) lock.lock();
                RouteSet routeSet = routeCache.get(serviceSpecification);
                if (routeSet != null) {
                    // If Route has no listeners at all, remove it.
                    if (!routeSet.hasListeners()) {
                        try {
                            log.debug("Marking route with id '" + route.getId() + "' for removal because it has " +
                                    "no listeners.");
                            removeRoute(route.getId(), false);
                        } catch (Exception e) {
                            log.warn("Error removing RouteSet for ServiceSpecification with id '" +
                                    routeSet.getServiceSpecificationId());
                        }
                        // If Route has listeners, iterate through all sessions listening to this RouteSet and
                        // remove any dead sessions.
                    } else {
                        for (String widgetMetadataId : routeSet.getListenerMap().keySet()) {
                            Set<String> widgetListeners = routeSet.getListenerMap().get(widgetMetadataId);
                            for (String sessionId : widgetListeners) {
                                ServerSession remote = bayeux.getSession(sessionId);
                                // Remove any dead sessions from this RouteSet
                                if (remote == null || !remote.isConnected()) {
                                    try {
                                        removeRouteListener(serviceSpecification, widgetMetadataId, sessionId);
                                    } catch (Exception e) {
                                        log.warn("Error removing listener for sessionId '" + sessionId + "' to Service " +
                                                "Specification '" + serviceSpecification.getId() + "' and Widget Metadata '" +
                                                widgetMetadataId + "'", e);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error checking health for Route associated with ServiceSpecification with id '" +
                        serviceSpecification.getId() + "'", e);
            } finally {
                if (lock != null) lock.unlock();
            }
        } else {
            log.debug("Could not find a matching ServiceSpecification for Dynamic Route with id '" +
                    route.getId() + "', so stopping Route.");
            removeRoute(route.getId(), false);
        }
    }

    private void gcPrivatePersistentRoute(Route route) {
        String sessionId = (String) routePropertyManager.getProperty(route.getId(),
                AbstractOoeRouteBuilder.ROUTE_LISTENER_PROPERTY);
        ServerSession remote = bayeux.getSession(sessionId);
        if (remote == null || !remote.isConnected()) {
            log.debug("Marking route with id '" + route.getId() + "' for removal because its listening session is dead.");
            removeRoute(route.getId(), false);
        }
    }

    private void gcPrivateTransientRoute(Route route) {
        Date created = transientRoutes.get(route.getId());
        if (created != null && created.getTime() + (privateRouteTtl * 1000) < new Date().getTime()) {
            log.debug("Marking route with id '" + route.getId() + "' for removal because its TTL has expired.");
            removeRoute(route.getId(), false);
        }
    }

    public String addPrivateRoute(ServiceSpecification serviceSpecification, String listener, boolean persistent)
            throws Exception {
        AbstractOoeRouteBuilder routeBuilder = constructRouteBuilder(
                serviceSpecification, AbstractOoeRouteBuilder.Destination.cometd);
        routeBuilder.setListener(listener);
        if (persistent) {
            routeBuilder.setGroup(AbstractOoeRouteBuilder.Group.PRIVATE_PERSISTENT);
        } else {
            routeBuilder.setGroup(AbstractOoeRouteBuilder.Group.PRIVATE_TRANSIENT);
            transientRoutes.put(routeBuilder.getRouteId(), new Date());
        }
        camelContext.addRoutes(routeBuilder);
        return routeBuilder.getRouteId();
    }

    public void removeRoute(final String routeId, boolean spawnThread) {
//        log.debug("Removing route with id '" + routeId + "'");
        if (spawnThread) {
            camelTaskExecutor.execute(new Runnable() {
                public void run() {
                    doRemoveRoute(routeId);
                }
            });
        } else {
            doRemoveRoute(routeId);
        }
    }

    private void doRemoveRoute(final String routeId) {
        try {
            camelContext.stopRoute(routeId, 5000, TimeUnit.MILLISECONDS);
            camelContext.removeRoute(routeId);
            transientRoutes.remove(routeId);
            routePropertyManager.removeRoute(routeId);
            log.debug("Removed route with id '" + routeId + "'");
        } catch (Exception e) {
            log.error("Error removing route with id '" + routeId + "'", e);
        }
    }

    @Override
    public void onExchangeDone(final Route route, Exchange exchange) {
        super.onExchangeDone(route, exchange);
        // Was this a short term route? If so, remove it from CamelContext.
        Date date = transientRoutes.get(route.getId());
        if (date != null) {
            log.debug("Marking route with id '" + route.getId() + "' for removal because its first Exchange is complete.");
            removeRoute(route.getId(), true);
        }
    }

    /**
     * Notifies all CometD listening sessions when new data is available for a given Service Specification
     *
     * @param serviceSpecificationId
     */
    public void notifyListeners(String serviceSpecificationId, int hashcode) throws Exception {
        Map<String, Object> payload = new HashMap<String, Object>();
        payload.put(DATA_AVAILABLE_PARAM, true);
        payload.put(HASHCODE_PARAM, "" + hashcode);
        sendToListeners(serviceSpecificationId, payload);
    }

//    public void sendToListener(String sessionId, Object payload) {
//        sendToListener(sessionId, payload, null);
//    }

    public void sendToListener(String sessionId, Object payload, Map<String, Object> params) {
        ServerSession remote = bayeux.getSession(sessionId);
        if (remote != null) {
            BasicDBObject basicDBObject = new BasicDBObject();
            basicDBObject.put(PAYLOAD_PARAM, payload);
            if (params != null) basicDBObject.putAll(params);
            cometDHelper.sendToDataChannel(serverSession, remote, UUID.randomUUID().toString(),
                    basicDBObject, "Data payload obtained successfully." + '"', HttpStatus.SC_OK);
        } else log.info("Could not create ServerSession for CometD session id '" + sessionId + "'");
    }

    public void sendToListeners(String serviceSpecificationId, final Object payload) throws Exception {
        final ServiceSpecification serviceSpecification = metadataCache.getServiceSpecification(serviceSpecificationId);
        if (serviceSpecification != null) {
            RouteSet routeSet = routeCache.get(serviceSpecification);
            if (routeSet != null) {
                for (final String widgetMetadataId : routeSet.getListenerMap().keySet()) {
                    Set<String> sessionIds = routeSet.getListenerMap().get(widgetMetadataId);

                    // Try to register listener set for this payload hashcode
                    if (payload instanceof Map) {
                        Map<String, Object> payloadMap = (Map<String, Object>) payload;
                        if (payloadMap.get(HASHCODE_PARAM) != null) {
                            try {
                                performanceMeter.registerListeners(new Integer((String) payloadMap.get(HASHCODE_PARAM)),
                                        new HashSet<String>(sessionIds));
                            } catch (NumberFormatException e) {
                                log.trace("Error extracting hashcode. ", e);
                            }
                        }
                    }

                    if (messageQueueEnabled) {
                        for (final String sessionId : sessionIds) {
                            BasicDBObject basicDBObject = new BasicDBObject();
                            basicDBObject.put(DataService.SERVICE_SPECIFICATION_ID_PARAM, serviceSpecification.getId());
                            basicDBObject.put(DataService.WIDGET_METADATA_ID_PARAM, widgetMetadataId);
                            basicDBObject.put(PAYLOAD_PARAM, payload);
                            messageQueue.push(sessionId, basicDBObject);
                        }
                    } else {
                        for (String sessionId : sessionIds) {
                            ServerSession remote = bayeux.getSession(sessionId);
                            if (remote != null) {
                                BasicDBObject basicDBObject = new BasicDBObject();
                                basicDBObject.put(DataService.SERVICE_SPECIFICATION_ID_PARAM, serviceSpecification.getId());
                                basicDBObject.put(DataService.WIDGET_METADATA_ID_PARAM, widgetMetadataId);
                                basicDBObject.put(PAYLOAD_PARAM, payload);
                                cometDHelper.sendReply(serverSession, remote, "/data/" + sessionId, UUID.randomUUID().toString(),
                                        basicDBObject, "Data is available for ServiceSpecification with id '" +
                                        serviceSpecification.getId() + "'", HttpStatus.SC_OK);
                            } else log.info("Could not create ServerSession for CometD session id '" + sessionId + "'");
                        }
                    }
                }
            }
        }
    }

    public void restartRoutes(ServiceSpecification serviceSpecification, WidgetMetadata widgetMetadata) throws Exception {
        log.debug("Restarting routes for serviceSpecification with id '" + serviceSpecification.getId() + "'");
        Lock lock = null;
        try {
            lock = lockMap.get(serviceSpecification.getId().intern());
            if (lock != null) lock.lock();

            // Attempt to update refresh interval to lower value
//            ServiceSpecification serviceSpecification = serviceRepository.findOne(serviceSpecificationId);
            long newInterval = Math.max(minimumRefreshIntervalSeconds, widgetMetadata.getRefreshIntervalSeconds());
            if (serviceSpecification.getRefreshIntervalSeconds() > widgetMetadata.getRefreshIntervalSeconds()) {
                log.debug("Updating refresh interval for ServiceSpecification with id '" + serviceSpecification.getId() +
                        "' from " + serviceSpecification.getRefreshIntervalSeconds() + " to " + newInterval);
                serviceSpecification.setRefreshIntervalSeconds(newInterval);
            }
//            serviceRepository.save(serviceSpecification);

            RouteSet routeSet = routeCache.get(serviceSpecification);
            if (routeSet != null) {
                removeRoute(routeSet.getServiceSpecificationId(), false);
                camelContext.addRoutes(routeSet.getRouteBuilder());
            }
        } finally {
            if (lock != null) lock.unlock();
        }
    }

    private AbstractOoeRouteBuilder constructRouteBuilder(ServiceSpecification serviceSpecification,
                                                          AbstractOoeRouteBuilder.Destination destination) throws InvocationTargetException, IllegalAccessException,
            InstantiationException, NoSuchMethodException {
        Class<AbstractOoeRouteBuilder> clazz = serviceRegistry.getRouteBuilder(serviceSpecification);
        Constructor<AbstractOoeRouteBuilder> constructor = clazz.getDeclaredConstructor(
                serviceSpecification.getClass(), AbstractOoeRouteBuilder.Destination.class, RoutePropertyManager.class);
        return constructor.newInstance(serviceSpecification, destination, routePropertyManager);
    }

    @ManagedOperation
    @ManagedOperationParameters({
            @ManagedOperationParameter(name = "serviceSpecificationId", description = "Service Specification Id")})
    public Set<String> getListeningSessions(String serviceSpecificationId)
            throws ExecutionException {
        ServiceSpecification serviceSpecification = metadataCache.getServiceSpecification(serviceSpecificationId);
        RouteSet routeSet = routeCache.get(serviceSpecification);
        Set<String> listeningSessions = new HashSet<String>();
        for (Set<String> sessions : routeSet.getListenerMap().values()) {
            listeningSessions.addAll(sessions);
        }
        return listeningSessions;
    }

    public CamelContext getCamelContext() {
        return camelContext;
    }

    public void setCamelContext(CamelContext camelContext) {
        this.camelContext = camelContext;
    }

}
