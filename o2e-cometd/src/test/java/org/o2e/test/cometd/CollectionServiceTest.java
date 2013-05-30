package org.o2e.test.cometd;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.cometd.service.collection.CollectionServiceDelegate;
import org.o2e.cometd.service.CometDHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 9/26/11
 * Time: 9:58 AM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-cometd-test.xml")
public class CollectionServiceTest extends CometdBaseTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());
    private String uuid = "4a3be636-495a-484d-90a0-28b06a1aa61c";
    private String collection = "col1";

    @Override
    public CometDTestConfig getConfig() {
        CometDTestConfig config = new CometDTestConfig();
        config.setCometdUrl("https://localhost:9443/sw-server/cometd");
        config.setUseFormLogin(true);
        config.setUsername("jsegal");
        config.setUserPassword("password");
        config.setKeyManagerPassword("password");
        return config;
    }

    @Test
    public void save() {
        String channel = "/service/collection/save";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            client.getChannel(channel).publish(constructInsertDocument());

            try {
                long sleep = 2000;
                log.info("Sleeping for " + sleep + " ms.");
                Thread.sleep(sleep);
            } catch (InterruptedException e) { }

            client.getChannel(channel).unsubscribe(listener);
        }
        else log.error("Invocation failed - not handshaken to cometd server.");
    }

//    @Test
    public void get() {
        String channel = "/service/collection/get";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, String> request = new HashMap<String, String>();
            request.put(CollectionServiceDelegate.COLLECTION_PARAM, collection);
            request.put(CollectionServiceDelegate.UUID_PARAM, uuid);
            client.getChannel(channel).publish(request);

            try {
                long sleep = 2000;
                log.info("Sleeping for " + sleep + " ms.");
                Thread.sleep(sleep);
            } catch (InterruptedException e) { }

            client.getChannel(channel).unsubscribe(listener);

        }
        else log.error("Invocation failed - not handshaken to cometd server.");
    }

//    @Test
    public void remove() {
        String channel = "/service/collection/remove";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, String> request = new HashMap<String, String>();
            request.put(CollectionServiceDelegate.COLLECTION_PARAM, collection);
            request.put(CollectionServiceDelegate.UUID_PARAM, uuid);
            client.getChannel(channel).publish(request);

            try {
                long sleep = 2000;
                log.info("Sleeping for " + sleep + " ms.");
                Thread.sleep(sleep);
            } catch (InterruptedException e) { }

            client.getChannel(channel).unsubscribe(listener);
        }
        else log.error("Invocation failed - not handshaken to cometd server.");
    }

//    @Test
    public void find() {
        String channel = "/service/collection/find";
        log.info("Invoking service at '" + channel + "'");
        if (handshaken) {
            client.getChannel(channel).subscribe(listener);
            Map<String, Object> request = new HashMap<String, Object>();
            request.put(CollectionServiceDelegate.COLLECTION_PARAM, collection);
            request.put(CometDHelper.PAGE_NUMBER_PARAM, "0");
            request.put(CometDHelper.PAGE_SIZE_PARAM, "10");

            Map<String, Object> query = new HashMap<String, Object>();
//            query.put("json.attr3", "val6");
//            query.put("json.uuid", uuid);
            request.put("query", query);
            client.getChannel(channel).publish(request);

            try {
                long sleep = 2000;
                log.info("Sleeping for " + sleep + " ms.");
                Thread.sleep(sleep);
            } catch (InterruptedException e) { }

            client.getChannel(channel).unsubscribe(listener);

        }
        else log.error("Invocation failed - not handshaken to cometd server.");
    }

    private Map<String, Object> constructDocumentWithArray() {
        Map<String, Object> requestMap = new HashMap<String, Object>();
        Map<String, Object> documentMap = new HashMap<String, Object>();
        Map<String, Object> json = new HashMap<String, Object>();
        List<Map<String, String>> columns = new ArrayList<Map<String, String>>();
        for (int i = 0; i < 3; i++) {
            Map<String, String> column = new HashMap<String, String>();
            column.put("test", "" + i);
            columns.add(column);
        }
        json.put("columns", columns);
        documentMap.put("date", new Date());
        documentMap.put("json", json);
        requestMap.put(CollectionServiceDelegate.COLLECTION_PARAM, collection);
        requestMap.put("document", documentMap);
        return requestMap;
    }

    private Map<String, Object> constructInsertDocument() {
        Map<String, Object> requestMap = new HashMap<String, Object>();
        Map<String, Object> documentMap = new HashMap<String, Object>();
        Map<String, Object> json = new HashMap<String, Object>();
        json.put("attr1", "val4");
        json.put("attr2", "val5");
        json.put("attr3", "val6");
        documentMap.put("color", "red");
        documentMap.put("name", "CollectionServiceDelegate doc - " + new Date());
//            documentMap.put("tags", new String[]{"taga", "tagb"});
        documentMap.put("json", json);
        requestMap.put(CollectionServiceDelegate.COLLECTION_PARAM, collection);
        requestMap.put("document", documentMap);
        return requestMap;
    }

    private Map<String, Object> constructUpdateDocument() {
        Map<String, Object> requestMap = new HashMap<String, Object>();
        Map<String, Object> emailMap = new HashMap<String, Object>();
        Map<String, Object> documentMap = new HashMap<String, Object>();
        Map<String, Object> json = new HashMap<String, Object>();
        json.put("attr1", "val4");
        json.put("attr2", "val5");
        json.put("attr3", "val6");
        documentMap.put("color", "red");
        documentMap.put("name", "CollectionServiceDelegate doc - " + new Date());
//            documentMap.put("tags", new String[]{"taga", "tagb"});
        documentMap.put(CollectionServiceDelegate.UUID_PARAM, uuid);
        documentMap.put("json", json);
        emailMap.put("subject", "PITS Report Update");
        emailMap.put("text", "Danny.malks just updated his PITS Report. Please click here to see the updates.");
        emailMap.put("from", "mailer@jackbe.com");
        emailMap.put("to", "execs@jackbe.com");
        requestMap.put(CollectionServiceDelegate.COLLECTION_PARAM, collection);
        requestMap.put("document", documentMap);
        requestMap.put("email", emailMap);
        return requestMap;
    }

//    @Test
//    public void testFilter() {
//        Map<String, Object> root = new HashMap<String, Object>();
//        root.put("name", "Jeff");
//        root.put("ignore", "me");
//        root.put("asd", "123");
//
//        Map<String, Object> description = new HashMap<String, Object>();
//        description.put("ignoreMeToo", "qwe");
//        description.put("english", "my desc");
//        root.put("description", description);
//
//        Map<String, Object> foo = new HashMap<String, Object>();
//        Map<String, Object> bar = new HashMap<String, Object>();
//        bar.put("baz", "59023525ldf");
//        foo.put("bar", bar);
//        root.put("foo", foo);
//
//        String[] filters = {"name", "description.english", "foo.bar.baz", "asd.123"};
//
//
//        String json = "{\"records\":{\"total\":\"397\",\"record\":[{\"tags\":\"\",\"id\":\"90FCI\",\"description\":\"Displays FCI, CRV, DM, Int, Struct, Roof, HVAC,Elec, Plum, conveyance,Ext\",\"name\":\"90FCI\"},{\"tags\":\"\\\"news\\\",RSS\",\"id\":\"AAATEST\",\"description\":\"test CNN \\\"news\\\"\",\"name\":\"AAATEST\"},{\"tags\":\"\",\"id\":\"Aaron_Another_RSS\",\"description\":\"\",\"name\":\"Aaron Another RSS\"},{\"tags\":\"\",\"id\":\"aaron_eq_demo\",\"description\":\"desc\",\"name\":\"aaron eq demo\"},{\"tags\":\"\",\"id\":\"aaron_eq_demo_1\",\"description\":\"desc\",\"name\":\"aaron eq demo 1\"},{\"tags\":\"\",\"id\":\"aaron_eq_demo_2\",\"description\":\"rss\",\"name\":\"aaron eq demo 2\"},{\"tags\":\"\",\"id\":\"Aaron_Top_Stories\",\"description\":\"\",\"name\":\"Aaron Top Stories\"},{\"tags\":\"\",\"id\":\"Aaron_Yahoo_as_Rest\",\"description\":\"\",\"name\":\"Aaron Yahoo as Rest\"},{\"tags\":\"\",\"id\":\"Aaron_Yahoo_Top_Stories1\",\"description\":\"\",\"name\":\"Aaron Yahoo Top Stories1\"},{\"tags\":\"\",\"id\":\"Africa_AIDS_Trend_Map\",\"description\":\"\",\"name\":\"Africa AIDS Trend Map\"}]}}";
//        Object obj = JSON.parse(json);
//        System.out.println(obj);
//
//    }

}
