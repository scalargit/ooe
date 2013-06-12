package org.o2e.test.cometd;

import org.cometd.bayeux.Message;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.cometd.service.DataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.inject.Inject;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/25/11
 * Time: 10:10 AM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-cometd-test.xml")
public class DataServiceTest extends CometdBaseTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Inject
    DynamicRouteTestHelper dynamicRouteTestHelper;

    @Override
    public CometDTestConfig getConfig() {
        CometDTestConfig config = new CometDTestConfig();
        config.setCometdUrl("https://localhost:8443/sc-server/cometd");
//        config.setCometdUrl("http://localhost:9191/turnkey-server/cometd");
//        config.setUsername("CN=sw-user, OU=DISA, OU=PKI, OU=DoD, O=U.S. Government, C=US");
        config.setUsername("jsegal");
        config.setUserPassword("password");
        config.setKeyManagerPassword("password");
        config.setUseBasicAuth(true);
        return config;
    }

    //    @Test
    public void transientListen() throws InterruptedException {
        if (handshaken) {
            String dataChannel = "/data/" + client.getId();
            String listenChannel = "/service/data/transient/listen";

            BlockingListener blockingListener = new BlockingListener();
            log.info("Subscribing...");
            client.getChannel(dataChannel).subscribe(listener);
            client.getChannel(listenChannel).subscribe(blockingListener);

            log.info("Publishing to '" + listenChannel + "'");
            client.getChannel(listenChannel).publish(dynamicRouteTestHelper.constructPrestoService("sw-dev.jackbe.com",
                    443, "UserManagerService", "getCurrentUser", 60, null));
            Message message = blockingListener.get();

            log.info("Sleeping...");
            Thread.sleep(1000 * 10);

            log.info("Unsubscribing...");
            client.getChannel(listenChannel).unsubscribe(listener);
            client.getChannel(dataChannel).unsubscribe(listener);
        }
    }

    //    @Test
    public void privateListen() throws InterruptedException {
        if (handshaken) {
            String dataChannel = "/data/" + client.getId();
            String listenChannel = "/service/data/private/listen";

            BlockingListener blockingListener = new BlockingListener();
            log.info("Subscribing...");
            client.getChannel(dataChannel).subscribe(listener);
            client.getChannel(listenChannel).subscribe(blockingListener);

            log.info("Publishing to '" + listenChannel + "'");
            client.getChannel(listenChannel).publish(dynamicRouteTestHelper.constructPrestoService("sw-dev.jackbe.com",
                    443, "UserManagerService", "getCurrentUser", 60, null));
            Message message = blockingListener.get();

            log.info("Sleeping...");
            Thread.sleep(1000 * 60);

            log.info("Unsubscribing...");
            client.getChannel(listenChannel).unsubscribe(listener);
            client.getChannel(dataChannel).unsubscribe(listener);
        }
    }

    @Test
    public void listenSynch() throws InterruptedException {
        if (handshaken) {
//            String localRssServiceId = "4eb921e4535c8eea89b41f93";
            String localPrestoServiceId = "50cf28a2656f1436d499277a";
            String localRestServiceId = "51b86ec1591788ad62576011";
            String serviceSpecificationId = localRestServiceId;
            String widgetMetadataId = DataService.DEFAULT_WIDGETMETADATA_ID;

            String listenChannel = "/service/data/shared/listen";
            String dataChannel = "/data/" + client.getId();
            String getChannel = "/service/data/cache/get";
            DataGetListener dataGetListener = new DataGetListener(client, getChannel);

            log.info("Subscribing to '" + dataChannel + "'");
            client.getChannel(dataChannel).subscribe(dataGetListener);
            log.info("Subscribing to '" + getChannel + "'");
            client.getChannel(getChannel).subscribe(listener);
            log.info("Subscribing to '" + listenChannel + "'");
            client.getChannel(listenChannel).subscribe(listener);

            log.info("Publishing to '" + listenChannel + "'");
            Map<String, String> request = new HashMap<String, String>();
//            request.put("password", "P@$$w0rd");
            request.put(DataService.SERVICE_SPECIFICATION_ID_PARAM, serviceSpecificationId);
            request.put(DataService.WIDGET_METADATA_ID_PARAM, widgetMetadataId);
            client.getChannel(listenChannel).publish(request);

            log.info("Sleeping...");
            Thread.sleep(1000 * 30);

            log.info("Unsubscribing...");
            client.getChannel(listenChannel).unsubscribe(listener);
            client.getChannel(getChannel).unsubscribe(dataGetListener);
            client.getChannel(dataChannel).unsubscribe(listener);
        }
    }

    //    @Test
    public void listenAsynch() throws InterruptedException {
        String remoteJumServiceId = "4ef22cf3e4b02a64836f3ca3";
        String localJumServiceId = "4f689b87aa86b371be951fa3";
        String serviceSpecificationId = localJumServiceId;
        String widgetMetadataId = DataService.DEFAULT_WIDGETMETADATA_ID;
        String listenChannel = "/service/data/shared/listen";
        String dataChannel = "/data/" + client.getId();
        String getChannel = "/service/data/cache/get";

        DataGetListener dataGetListener = new DataGetListener(client, getChannel);
        BlockingListener blockingListener = new BlockingListener();
        Message message = null;

        log.info("Subscribing to '" + dataChannel + "'");
        client.getChannel(dataChannel).subscribe(dataGetListener);
        log.info("Subscribing to '" + listenChannel + "'");
        client.getChannel(listenChannel).subscribe(blockingListener);
        log.info("Subscribing to '" + getChannel + "'");
        client.getChannel(getChannel).subscribe(listener);

        Thread.sleep(1000);
        log.info("Publishing to '" + listenChannel + "'");
        Map<String, String> request = new HashMap<String, String>();
        request.put(DataService.SERVICE_SPECIFICATION_ID_PARAM, serviceSpecificationId);
        client.getChannel(listenChannel).publish(request);
        message = blockingListener.get();

        log.info("Sleeping (to wait for asynch JUM messages)...");
        Thread.sleep(1000 * 60 * 30);

        log.info("Unsubscribing...");
        client.getChannel(listenChannel).unsubscribe(listener);
        client.getChannel(dataChannel).unsubscribe(listener);
    }

    //    @Test
//    public void publish() {
//        if (handshaken) {
//            String serviceId = "4e9752b965d5fc432d1900fd";
//            String serviceChannel = "/service/data/publish";
//            String dataChannel = "/data/" + serviceId;
//            client.getChannel(serviceChannel).subscribe(listener);
//            Map<String, String> request = new HashMap<String, String>();
//            //TODO: test passwords with ampersands
////            String xmppUri = "xmpp://jabber.org:5222?room=o2e&user=o2e-user&password=P@$$w0rd&serviceName=jabber.org";
////            String toUri = "direct://jabber.org5222o2eo2e-user";
//            request.put("password", "P@$$w0rd");
//            request.put("serviceId", serviceId);
//            request.put("text", "my message");
//            client.getChannel(serviceChannel).publish(request);
//            client.getChannel(dataChannel).subscribe(listener);
//
//            try {
//                Thread.sleep(50000000);
//            } catch (InterruptedException e) {
//            }
//
//            client.getChannel(serviceChannel).unsubscribe(listener);
//            client.getChannel(dataChannel).unsubscribe(listener);
//
//        }
//    }

}
