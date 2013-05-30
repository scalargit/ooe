package org.o2e.test.cometd;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.cometd.service.CometDHelper;
import org.o2e.cometd.service.WidgetMetadataService;
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
 * Date: 10/31/11
 * Time: 10:09 AM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-cometd-test.xml")
public class WidgetMetadataServiceTest extends CometdBaseTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    String widgetId = "50cf28a2656f1436d499277d";

    @Inject
    DynamicRouteTestHelper dynamicRouteTestHelper;

    @Override
    public CometDTestConfig getConfig() {
        CometDTestConfig config = new CometDTestConfig();
        config.setCometdUrl("https://o2e.jackbe.com:9443/sw-server/cometd");
        config.setUsername("CN=sw.jackbe.com, OU=DISA, OU=PKI, OU=DoD, O=U.S. Government, C=US");
        config.setUserPassword("mockPassword");
        config.setKeyManagerPassword("password");
        config.setUseBasicAuth(false);
        return config;
    }

    //    @Test
    public void saveMetadata() {
        String channel = "/service/widget/save";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            client.getChannel(channel).publish(dynamicRouteTestHelper.constructWidgetMetadata(120));

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
        String channel = "/service/widget/remove";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, String> request = new HashMap<String, String>();
            request.put(WidgetMetadataService.ID_PARAM, widgetId);
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

    @Test
    public void getMetadata() {
        String channel = "/service/widget/get";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, String> request = new HashMap<String, String>();
            request.put(WidgetMetadataService.ID_PARAM, widgetId);
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
        String channel = "/service/widget/findAll";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, String> query = new HashMap<String, String>();
            query.put(CometDHelper.PAGE_NUMBER_PARAM, "" + 0);
            query.put(CometDHelper.PAGE_SIZE_PARAM, "" + 10);
            Map<String, Object> request = new HashMap<String, Object>();
            request.put(CometDHelper.QUERY_PARAM, query);
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
    public void findMetadata() {
        String channel = "/service/widget/find";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, String> query = new HashMap<String, String>();
            query.put("clientConnector", "presto");

            Map<String, Object> request = new HashMap<String, Object>();
            request.put(CometDHelper.QUERY_PARAM, query);
            request.put(CometDHelper.PAGE_NUMBER_PARAM, "" + 0);
            request.put(CometDHelper.PAGE_SIZE_PARAM, "" + 10);
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

}
