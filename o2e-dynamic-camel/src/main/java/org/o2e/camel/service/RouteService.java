package org.o2e.camel.service;

import org.apache.camel.Exchange;
import org.apache.camel.Route;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.o2e.mongo.pojo.WidgetMetadata;

import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 2/10/12
 * Time: 12:10 PM
 * To change this template use File | Settings | File Templates.
 */
public interface RouteService {

    /**
     * Adds sessionId as a new <code>AbstractOoeRouteBuilder.Group.SHARED</code> Route Listener to the specified
     * ServiceSpecification and WidgetMetadata instances. If no listeners exist for the ServiceSpecification,
     * creates a new Route as well.
     * @param serviceSpecification
     * @param widgetMetadataId
     * @param sessionId
     * @return true if the a new Route was created, false otherwise.
     * @throws Exception
     */
    public boolean addRouteListener(ServiceSpecification serviceSpecification, String widgetMetadataId,
                                    String sessionId) throws Exception;

    /**
     * Removes sessionId as a <code>AbstractOoeRouteBuilder.Group.SHARED</code> Route Listener to the specified
     * ServiceSpecification and WidgetMetadata instances. If no listeners exist for the ServiceSpecification,
     * after removal, removes the Route as well.
     * @param serviceSpecification
     * @param widgetMetadataId
     * @param sessionId
     * @return true if the backing Route was removed, false otherwise.
     * @throws Exception
     */
    public boolean removeRouteListener(ServiceSpecification serviceSpecification, String widgetMetadataId,
                                       String sessionId) throws Exception;

    /**
     * Adds a new <code>AbstractOoeRouteBuilder.Group.PRIVATE_TRANSIENT</code> Route to the given ServiceSpecification.
     * @param serviceSpecification
     * @param listener the session listening to this Route
     * @param persistent - whether or not the route should be persisted for the lifetime of the listener's session
     * @return
     * @throws Exception
     */
    public String addPrivateRoute(ServiceSpecification serviceSpecification, String listener, boolean persistent) throws Exception;

    /**
     * Removes and re-adds Routes to the CamelContext for the given ServiceSpecification.
     * @param serviceSpecification
     * @param widgetMetadata
     * @throws Exception
     */
    public void restartRoutes(ServiceSpecification serviceSpecification, WidgetMetadata widgetMetadata) throws Exception;

    /**
     * Removes the route with the given routeId. Runs asynchronously in a new thread if spawnThread is true.
     * @param routeId
     * @param spawnThread
     */
    public void removeRoute(final String routeId, boolean spawnThread);

    /**
     * Notifies all listening sessions that new data with the given hashcode is available for the given
     * ServiceSpecification
     * @param serviceSpecificationId
     * @param hashcode
     * @throws Exception
     */
    public void notifyListeners(String serviceSpecificationId, int hashcode) throws Exception;

    /**
     * Sends a message to a listening session.
     * @param sessionId the session to send to.
     * @param payload the payload to send.
     * @param params optional metadata to include in the messasge.
     */
    public void sendToListener(String sessionId, Object payload, Map<String, Object> params);

    /**
     * Sends a message to all listening sessions for the <code>AbstractOoeRouteBuilder.Group.SHARED</code> Route
     * associated with the given ServiceSpecification.
     * @param serviceSpecificationId
     * @param payload
     * @throws Exception
     */
    public void sendToListeners(String serviceSpecificationId, Object payload) throws Exception;

    /**
     * Should be called periodically to ensure against "Route leaks" in Camel.
     */
    public void garbageCollect();

}
