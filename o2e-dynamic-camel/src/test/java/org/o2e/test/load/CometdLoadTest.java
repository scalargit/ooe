package org.o2e.test.load;

import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.JUnitCore;
import org.junit.runner.RunWith;
import org.o2e.cometd.service.DataService;
import org.o2e.test.cometd.CometDTestConfig;
import org.o2e.test.cometd.DataGetListener;
import org.o2e.test.cometd.DynamicRouteTestHelper;
import org.o2e.util.KeyStoreUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.inject.Inject;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.Assert.assertTrue;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/19/12
 * Time: 5:04 PM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-load-test.xml")
public class CometdLoadTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());
    final String listenChannel = "/service/data/shared/listen";
    final String getChannel = "/service/data/cache/get";

    @Value("${org.o2e.server.cometd.test.load.cometBase}")
    String host;
//    String host = "https://o2e.jackbe.com:9443/sw-server/cometd";

    @Value("${org.o2e.server.cometd.test.load.prestoHost}")
    String prestoHost;
//    String prestoHost = "sw-dev.jackbe.com";

    @Value("${org.o2e.server.cometd.test.load.prestoPort}")
    int prestoPort;
//    int prestoPort = 443;

    @Value("${org.o2e.server.cometd.test.load.numClients}")
    int numClients;
//    int numClients = 1;

    @Value("${org.o2e.server.cometd.test.load.testDurationMillis}")
    int testDurationMillis;
//    int testDurationMillis = 1000 * 60 * 5;

    List<CometdLoadClient> clients = new ArrayList<CometdLoadClient>();
    List<String> serviceSpecIds = new ArrayList<String>();
    List<String> widgetSpecIds = new ArrayList<String>();
    ExecutorService executorService;

    @Autowired
    KeyStoreUtil keyStoreUtil;

    @Inject
    DynamicRouteTestHelper dynamicRouteTestHelper;

//    AggregateSummaryStatistics aggregateSummaryStatistics = new AggregateSummaryStatistics();
//    SynchronizedDescriptiveStatistics stats = new SynchronizedDescriptiveStatistics();

    @Before
    public void init() throws Exception {
        executorService = Executors.newFixedThreadPool(numClients);
        for (int i = 0; i < numClients; i++) {
            long start = new Date().getTime();
            log.info("Spinning up client " + i + " against host '" + host + "'...");

            CometDTestConfig config = new CometDTestConfig();
//            config.setCometdUrl("https://o2e.jackbe.com:443/sw-server/cometd");
            config.setCometdUrl(host);
            config.setTimeoutMillis(1000 * 30);

            CometdLoadClient cometdLoadClient = new CometdLoadClient(config);
            cometdLoadClient.setKeyStoreUtil(keyStoreUtil);
            cometdLoadClient.handshake();

            String dataChannel = "/data/" + cometdLoadClient.getClient().getId();
            DataGetListener dataGetListener = new DataGetListener(cometdLoadClient.getClient(),
                    getChannel);
            cometdLoadClient.setDataGetListener(dataGetListener);


            log.info("Subscribing to '" + getChannel + "'");
            cometdLoadClient.getClient().getChannel(getChannel).subscribe(cometdLoadClient.getListener());
            log.info("Subscribing to '" + listenChannel + "'");
            cometdLoadClient.getClient().getChannel(listenChannel).subscribe(cometdLoadClient.getListener());
            log.info("Subscribing to '" + dataChannel + "'");
            cometdLoadClient.getClient().getChannel(dataChannel).subscribe(dataGetListener);

            long end = new Date().getTime();
            clients.add(cometdLoadClient);
            log.info("Spun up client " + i + " in " + (end - start) + " ms.");
        }
        log.info("Spun up " + clients.size() + " client(s).");
    }

    @Test
    public void loadTest() throws InterruptedException {
        createServiceSpecs();
        // Sleep a few seconds to prevent a race condition with subscriptions on new specs
        Thread.sleep(1000 * 3);
        subscribe();
        Thread.sleep(testDurationMillis);
        unsubscribe();
        deleteSpecs();
        aggregateStats();
        disconnect();
    }

    public void createServiceSpecs() {
        assertTrue(clients != null && clients.size() > 0);
//        serviceSpecIds.add(dynamicRouteTestHelper.saveService(clients.get(0).getClient(), "/service/metadata/save",
//                dynamicRouteTestHelper.constructPrestoService(prestoHost, prestoPort,
//                        "random2", "Invoke", 25, null)));
        serviceSpecIds.add(dynamicRouteTestHelper.saveService(clients.get(0).getClient(), "/service/metadata/save",
                dynamicRouteTestHelper.constructPrestoService(prestoHost, prestoPort,
                        "random2", "Invoke", 60, null)));
//        serviceSpecIds.add(dynamicRouteTestHelper.saveService(clients.get(0).getClient(), "/service/metadata/save",
//                dynamicRouteTestHelper.constructPrestoService(prestoHost, prestoPort,
//                        "random2", "Invoke", 115, null)));

//        widgetSpecIds.add(dynamicRouteTestHelper.saveService(clients.get(0).getClient(), "/service/widget/save",
//                dynamicRouteTestHelper.constructWidgetMetadata(30)));
        widgetSpecIds.add(dynamicRouteTestHelper.saveService(clients.get(0).getClient(), "/service/widget/save",
                dynamicRouteTestHelper.constructWidgetMetadata(60)));
//        widgetSpecIds.add(dynamicRouteTestHelper.saveService(clients.get(0).getClient(), "/service/widget/save",
//                dynamicRouteTestHelper.constructWidgetMetadata(120)));
    }

    public void disconnect() {
        for (final CometdLoadClient cometdLoadClient : clients) {
            cometdLoadClient.getClient().disconnect(1000);
        }
    }

    public void deleteSpecs() {
        for (int i = 0; i < serviceSpecIds.size(); i++) {
            log.info("Deleting service spec with id '" + serviceSpecIds.get(i) + "'");
            DynamicRouteTestHelper.removeService(clients.get(0).getClient(), "/service/metadata/remove", serviceSpecIds.get(i));
            log.info("Deleting widget spec with id '" + widgetSpecIds.get(i) + "'");
            DynamicRouteTestHelper.removeService(clients.get(0).getClient(), "/service/widget/remove", widgetSpecIds.get(i));
        }
    }

    public void subscribe() throws InterruptedException {
        for (final CometdLoadClient cometdLoadClient : clients) {
            for (int i = 0; i < serviceSpecIds.size(); i++) {
                if (cometdLoadClient.isHandshaken()) {
                    log.info("Submitting callable for client '" + cometdLoadClient.getClient().getId() + "'");
                    final int index = i;
                    executorService.submit(new Runnable() {
                        public void run() {
                            log.info("Publishing to '" + listenChannel + "'");
                            Map<String, String> request = new HashMap<String, String>();
                            request.put(DataService.SERVICE_SPECIFICATION_ID_PARAM, serviceSpecIds.get(index));
                            request.put(DataService.WIDGET_METADATA_ID_PARAM, widgetSpecIds.get(index));
                            log.info("Publishing request to listen to serviceSpecification with id '" +
                                    serviceSpecIds.get(index) + "'" + " and widget spec with id '" +
                                    widgetSpecIds.get(index) + "'");
                            cometdLoadClient.getClient().getChannel(listenChannel).publish(request);
                        }
                    });

                }
            }
        }
    }

    public void unsubscribe() {
        for (final CometdLoadClient cometdLoadClient : clients) {
            String dataChannel = "/data/" + cometdLoadClient.getClient().getId();
            log.info("Unsubscribing from '" + dataChannel + "...");
            cometdLoadClient.getClient().getChannel(dataChannel).unsubscribe(cometdLoadClient.getListener());
            cometdLoadClient.getClient().getChannel(listenChannel).unsubscribe(cometdLoadClient.getListener());
            cometdLoadClient.getClient().getChannel(getChannel).unsubscribe(cometdLoadClient.getDataGetListener());
            log.info("Ignored " + cometdLoadClient.getDataGetListener().getNumIgnoredMessages() + " out of " +
                    cometdLoadClient.getDataGetListener().getTotalMessages() + " message(s).");
        }
    }

    public void aggregateStats() {
        List<Double> allLatencies = new ArrayList<Double>();
        for (final CometdLoadClient cometdLoadClient : clients) {
            allLatencies.addAll(cometdLoadClient.getDataGetListener().getLatencies());
        }
        DescriptiveStatistics descriptiveStatistics = new DescriptiveStatistics(
                ArrayUtils.toPrimitive(allLatencies.toArray(new Double[allLatencies.size()])));
        log.error(descriptiveStatistics.toString());
    }

    public static void main(String[] args) {
        String clazz = new CometdLoadTest().getClass().getName();
        System.out.println("Starting JUnit for class '" + clazz + "'");
        JUnitCore.main(clazz);
    }

}
