package org.o2e.test.cometd;

import org.cometd.bayeux.Message;
import org.cometd.client.BayeuxClient;

import javax.annotation.Nullable;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.*;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 2/7/12
 * Time: 12:16 PM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
public class DynamicRouteTestHelper {

    public static void removeService(BayeuxClient bayeuxClient, String channel, String id) {
        BlockingListener blockingListener = new BlockingListener();
        bayeuxClient.getChannel(channel).subscribe(blockingListener);
        Map<String, String> removeRequest = new HashMap<String, String>();
        removeRequest.put("id", id);
        bayeuxClient.getChannel(channel).publish(removeRequest);
        Message removeResponse = blockingListener.get();
        assertNotNull(removeResponse);
        assertEquals((long) 200, removeResponse.get("statusCode"));
    }

    public String saveService(BayeuxClient bayeuxClient, String channel, Map<String, Object> saveRequest) {
        BlockingListener blockingListener = new BlockingListener();
        bayeuxClient.getChannel(channel).subscribe(blockingListener);
        bayeuxClient.getChannel(channel).publish(saveRequest);
        Message saveResponse = blockingListener.get();
        assertNotNull(saveResponse);
        assertEquals((long) 200, saveResponse.get("statusCode"));
        assertNotNull(saveResponse.getDataAsMap());
        String id = (String) saveResponse.getDataAsMap().get("_id");
        assertNotNull(id);
        return id;
    }

    public Map<String, Object> constructWidgetMetadata(int refreshIntervalSeconds) {
        List<Map<String, String>> request = new ArrayList<Map<String, String>>();
        Map<String, String> request1 = new HashMap<String, String>();
        request1.put("name", "sid");
        request1.put("header", "Service ID");
        request1.put("defaultValue", "SI_Geocoded_Fellows_FY10");
        Map<String, String> request2 = new HashMap<String, String>();
        request2.put("name", "oid");
        request2.put("header", "Operation ID");
        request2.put("defaultValue", "Invoke");
        request.add(request1);
        request.add(request2);

        List<Map<String, Object>> response = new ArrayList<Map<String, Object>>();
        Map<String, Object> response1 = new HashMap<String, Object>();
        response1.put("name", "CURNTAFFL");
        response1.put("header", "Affiliation");
        response1.put("annotations", new String[]{"title", "title2"});
        response1.put("defaultValue", "defaultAffiliation");
        Map<String, Object> response2 = new HashMap<String, Object>();
        response2.put("name", "Lat");
        response2.put("header", "Latitude");
        response2.put("annotations", new String[]{"marker_lat", "marker_lat2"});
        response2.put("defaultValue", "defaultLat");
        Map<String, Object> response3 = new HashMap<String, Object>();
        response3.put("name", "Long");
        response3.put("header", "Longitude");
        response3.put("annotations", new String[]{"marker_lng", "marker_lng2"});
        response3.put("defaultValue", "defaultLong");
        response.add(response1);
        response.add(response2);
        response.add(response3);

        Map<String, Object> viz = new HashMap<String, Object>();
        Map<String, String> vizGmap = new HashMap<String, String>();
        vizGmap.put("marker", "images/FF6600.png");
        vizGmap.put("widgetTitle", "Institutions Represented by SI Research Fellows (Map)");
        Map<String, String> vizGrid = new HashMap<String, String>();
        vizGrid.put("widgetTitle", "Institutions Represented by SI Research Fellows (Table)");
        List<String> vizList = new ArrayList<String>();
        vizList.add("listitem1");
        vizList.add("listitem2");
        viz.put("gmap", vizGmap);
        viz.put("grid", vizGrid);
        viz.put("vizList", vizList);

        Map<String, Object> widgetMetadata = new HashMap<String, Object>();
        widgetMetadata.put("name", "presto test - " + new Date());
        widgetMetadata.put("clientConnector", "presto");
        widgetMetadata.put("connectorAction", "invoke");
        widgetMetadata.put("recordBreak", "DataTable.Entry");
        widgetMetadata.put("request", request);
        widgetMetadata.put("response", response);
        widgetMetadata.put("viz", viz);
        widgetMetadata.put("refreshIntervalSeconds", refreshIntervalSeconds);
        widgetMetadata.put("category", "aCategory");
        widgetMetadata.put("type", "aType");
        widgetMetadata.put("creator", "aUser");
        widgetMetadata.put("createdTime", new Date().getTime());
        widgetMetadata.put("lastUpdatedBy", "aUser");
        widgetMetadata.put("lastUpdatedTime", new Date().getTime());
        widgetMetadata.put("actions", new String[]{"action1", "action2"});
        return widgetMetadata;
    }

    public Map<String, Object> constructPrestoService(String prestoHost, int prestoPort, String sid, String oid,
                                                      long refreshInterval, @Nullable Map<String, String> httpHeaders) {
        Map<String, Object> service = new HashMap<String, Object>();
        service.put("name", sid + "." + oid);
        service.put("dataType", "presto");
        service.put("append", "false");
        service.put("refreshIntervalSeconds", refreshInterval);
        service.put("prestoHostname", prestoHost);
        service.put("prestoPort", prestoPort);
        service.put("prestoSid", sid);
        service.put("prestoOid", oid);
        service.put("version", "1.1");
        service.put("svcVersion", "0.1");
        service.put("isSecure", "true");
        service.put("shared", "false");
        service.put("assertUser", "true");

        if (httpHeaders != null) {
//            httpHeaders.put("x-p-anonymous", "true");
//            httpHeaders.put(AkamaiFilter.AKAMAI_X509_USER_HEADER, "CN=sw-user, OU=CONTRACTOR, OU=PKI, OU=DoD, O=U.S. Government, C=US");
            service.put("httpHeaders", httpHeaders);
        }
        return service;
    }

    public Map<String, Object> constructEmService(String serviceBase, String deliveryEndpoint, String topic,
                                                  long refreshIntervalSeconds) {
        Map<String, Object> service = new HashMap<String, Object>();
        service.put("name", topic + "-service");
        service.put("dataType", "em");
        service.put("append", "false");
        service.put("refreshIntervalSeconds", refreshIntervalSeconds);
        service.put("serviceBase", serviceBase);
        service.put("deliveryEndpoint", deliveryEndpoint);
        service.put("topic", topic);
        return service;
    }

    public Map<String, Object> constructIdMap(String id) {
        return constructIdMap(id, new HashMap<String, Object>());
    }

    public Map<String, Object> constructIdMap(String id, Map<String, Object> map) {
        map.put("_id", id);
        return map;
    }

    public Map<String, Object> constructPrestoService(String id, String prestoHost, int prestoPort, String sid, String oid,
                                                      long refreshInterval, @Nullable Map<String, String> httpHeaders) {
        return constructIdMap(id, constructPrestoService(prestoHost, prestoPort, sid, oid, refreshInterval, httpHeaders));
    }

    public Map<String, Object> constructRssService(String id) {
        return constructIdMap(id, constructRssService());
    }

    public Map<String, Object> constructRssService() {
        Map<String, Object> service = new HashMap<String, Object>();
        Map<String, String> requestParameters = new HashMap<String, String>();
        service.put("uri", "http://local.yahooapis.com/MapsService/rss/trafficData.xml");
//            service.put("uri", "not a valid URI");
        requestParameters.put("appid", "YdnDemo");
        requestParameters.put("zip", "22201");
        service.put("name", "Yahoo Data Test");
        service.put("dataType", "rss");
        service.put("append", "false");
        service.put("refreshIntervalSeconds", "60");
//            service.put("anotherProperty", "someValue");
        service.put("requestParameters", requestParameters);
        return service;
    }

}
