package org.o2e.test.cometd;

import org.apache.camel.component.http4.HttpMethods;
import org.cometd.bayeux.Message;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.cometd.service.CometDHelper;
import org.o2e.cometd.service.MetadataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.inject.Inject;
import java.util.*;

import static org.junit.Assert.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/11/11
 * Time: 10:17 AM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-cometd-test.xml")
public class MetadataServiceTest extends CometdBaseTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    String id = "4f689b35aa86b371be951fa1";

    @Inject
    DynamicRouteTestHelper dynamicRouteTestHelper;

    @Override
    public CometDTestConfig getConfig() {
        CometDTestConfig config = new CometDTestConfig();
        config.setCometdUrl("https://localhost:8443/sc-server/cometd");
        config.setUsername("jsegal");
        config.setUserPassword("password");
        config.setKeyManagerPassword("password");
        config.setUseBasicAuth(true);
        return config;
    }

    //    @Test
    public void crudTest() {
        log.info("Saving Services...");
        List<String> ids = saveServices();

        log.info("Finding Services...");
        findServices(ids);

        log.debug("Removing Services...");
        removeServices(ids);
    }

//    @Test
//    public void dataTypeTest() throws InterruptedException {
//        String dataType = "presto";
//        List initial = findByDataType(dataType);
//        log.info("Found " + initial.size() + " services before save.");
//        String prestoId = saveService(dynamicRouteTestHelper.constructPrestoService());
//        String rssId = saveService(dynamicRouteTestHelper.constructRssService());
//        Thread.sleep(20000);
//        log.info("Found " + initial.size() + " services after save.");
//        List afterSave = findByDataType(dataType);
////        assertEquals(initial.size() + 1, afterSave.size());
//        removeService(prestoId);
//        removeService(rssId);
//        Thread.sleep(20000);
//        List afterRemove = findByDataType(dataType);
//        log.info("Found " + initial.size() + " services after remove.");
//
////        assertEquals(initial.size(), afterRemove.size());
//    }

    @Test
    public void saveRestService() {
//        dynamicRouteTestHelper.saveService(client, "/service/metadata/save", dynamicRouteTestHelper.constructRestService(
//                "http://198.186.190.22/render?target=system.bb.port1.hash1.port.all.bytes&target=system.bb.port1." +
//		                "hash1.port.119.bytes&target=system.bb.port1.hash1.port.20000.bytes&target=system.bb.port1." +
//		                "hash1.port.7788.bytes&from=-1minutes&format=json&until=now&targets=all%2C119%2C20000&jsonp=&_=" +
//		                "1370279924660",
//                HttpMethods.GET, 60, "rest", new HashMap<String, Object>(), null));
	    dynamicRouteTestHelper.saveService(client, "/service/metadata/save", dynamicRouteTestHelper.constructRestService(
             "http://198.186.190.22/render?target=system.bb.port1.hash1.port.all.bytes&target=system.bb.port1." +
               "hash1.port.119.bytes&target=system.bb.port1.hash1.port.20000.bytes&target=system.bb.port1." +
               "hash1.port.7788.bytes&from=-1minutes&format=json&until=now&targets=all%2C119%2C20000",
             HttpMethods.GET, 60, "sensor", new HashMap<String, Object>(), null));
    }

    private List<String> saveServices() {
        List<String> ids = new ArrayList<String>();
        ids.add(dynamicRouteTestHelper.saveService(client, "/service/metadata/save", dynamicRouteTestHelper.
                constructPrestoService("sw-dev.jackbe.com", 443, "UserManagerService", "getCurrentUser", 60, null)));
        ids.add(dynamicRouteTestHelper.saveService(client, "/service/metadata/save", dynamicRouteTestHelper.
                constructRssService()));
        return ids;
    }

    private void findServices(List<String> ids) {
        for (String id : ids) {
            findService(id);
        }

    }

    private void removeServices(List<String> ids) {
        for (String id : ids) {
            DynamicRouteTestHelper.removeService(this.client, "/service/metadata/remove", id);
        }
    }

    private void findService(String id) {
        BlockingListener blockingListener = new BlockingListener();
        String findChannel = "/service/metadata/find";
        client.getChannel(findChannel).subscribe(blockingListener);
        Map<String, Object> findRequest = new HashMap<String, Object>();
        Map<String, String> query = new HashMap<String, String>();
        query.put("_id", id);
        findRequest.put(CometDHelper.QUERY_PARAM, query);
        client.getChannel(findChannel).publish(findRequest);
        Message findResponse = blockingListener.get();
        assertNotNull(findResponse);
        assertEquals((long) 200, findResponse.get("statusCode"));
        assertNotNull(findResponse.getDataAsMap());
        Object[] records = (Object[]) findResponse.getDataAsMap().get(CometDHelper.RECORDS_PARAM);
        assertNotNull(records);
        assertTrue("Expected exactly one record.", records.length == 1);
    }

    private List findAllServices() {
        Map<String, Object> request = new HashMap<String, Object>();
        request.put(CometDHelper.PAGE_NUMBER_PARAM, "" + 0);
        request.put(CometDHelper.PAGE_SIZE_PARAM, "" + Integer.MAX_VALUE);
        return doFind("/service/metadata/find", request);
    }

    private List findByDataType(String dataType) {
        Map<String, Object> request = new HashMap<String, Object>();
        request.put(CometDHelper.PAGE_NUMBER_PARAM, "" + 0);
        request.put(CometDHelper.PAGE_SIZE_PARAM, "" + Integer.MAX_VALUE);
        request.put(MetadataService.DATA_TYPE_QUERY_PARAM, dataType);
        return doFind("/service/metadata/findByDataType", request);
    }

    private List doFind(String channel, Map<String, Object> request) {
        BlockingListener blockingListener = new BlockingListener();
        client.getChannel(channel).subscribe(blockingListener);
        client.getChannel(channel).publish(request);
        Message response = blockingListener.get();
        assertNotNull(response);
        Object[] results = (Object[]) response.getDataAsMap().get(MetadataService.RESULTS_PARAM);
        return Arrays.asList(results);
    }

    //    @Test
    public void getMetadata() {
        String channel = "/service/metadata/get";
        log.info("Invoking serviceSpecification at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, String> request = new HashMap<String, String>();
            request.put("id", id);
            client.getChannel(channel).publish(request);

            try {
                long sleep = 2000;
                log.info("Sleeping for " + sleep + " ms.");
                Thread.sleep(sleep);
            } catch (InterruptedException e) {
            }

            client.getChannel(channel).unsubscribe(listener);

        } else log.error("Invocation failed - not handshaken to cometd server.");
    }

    //    @Test
    public void removeMetadata() {
        String channel = "/service/metadata/remove";
        log.info("Invoking serviceSpecification at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, String> request = new HashMap<String, String>();
            request.put("id", id);
            client.getChannel(channel).publish(request);

            try {
                long sleep = 2000;
                log.info("Sleeping for " + sleep + " ms.");
                Thread.sleep(sleep);
            } catch (InterruptedException e) {
            }

            client.getChannel(channel).unsubscribe(listener);
        } else log.error("Invocation failed - not handshaken to cometd server.");
    }

//    @Test
    public void findAllMetadata() {
        String channel = "/service/metadata/find";
        log.info("Invoking serviceSpecification at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, Object> request = new HashMap<String, Object>();
            request.put(CometDHelper.PAGE_NUMBER_PARAM, "" + 0);
            request.put(CometDHelper.PAGE_SIZE_PARAM, "" + 10);
            client.getChannel(channel).publish(request);

            try {
                long sleep = 10000;
                log.info("Sleeping for " + sleep + " ms.");
                Thread.sleep(sleep);
            } catch (InterruptedException e) {
            }

            client.getChannel(channel).unsubscribe(listener);

        } else log.error("Invocation failed - not handshaken to cometd server.");
    }

//    @Test
//    public void findByDataType() {
//        String channel = "/service/metadata/findByDataType";
//        log.info("Invoking serviceSpecification at '" + channel + "'");
//        if (handshaken) {
//            client.getChannel(channel).subscribe(listener);
//            Map<String, Object> request = new HashMap<String, Object>();
////            Map<String, String> query = new HashMap<String, String>();
//            request.put(CometDHelper.PAGE_NUMBER_PARAM, ""+ 0);
//            request.put(CometDHelper.PAGE_SIZE_PARAM, ""+ 10);
//            request.put(MetadataService.DATA_TYPE_QUERY_PARAM, "jum");
//            client.getChannel(channel).publish(request);
//
//            try {
//                long sleep = 2000;
//                log.info("Sleeping for " + sleep + " ms.");
//                Thread.sleep(sleep);
//            } catch (InterruptedException e) { }
//
//            client.getChannel(channel).unsubscribe(listener);
//
//        }
//        else log.error("Invocation failed - not handshaken to cometd server.");
//   }

    //    @Test
    public void saveMetadata() {
        String channel = "/service/metadata/save";
        log.info("Invoking serviceSpecification at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            client.getChannel(channel).publish(dynamicRouteTestHelper.constructPrestoService(id, "sw-dev.jackbe.com",
                    443, "UserManagerService", "getCurrentUser", 60, null));

            try {
                long sleep = 1000 * 5;
                log.info("Sleeping for " + sleep + " ms.");
                Thread.sleep(sleep);
            } catch (InterruptedException e) {
            }

            client.getChannel(channel).unsubscribe(listener);
        } else log.error("Invocation failed - not handshaken to cometd server.");
    }

}
