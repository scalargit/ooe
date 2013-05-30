package org.o2e.test.queue;

import org.apache.commons.lang.RandomStringUtils;
import org.eclipse.jetty.util.ConcurrentHashSet;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.camel.service.MessageQueue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.Date;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 12/14/12
 * Time: 10:45 AM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-message-queue-test.xml")
public class MessageQueueTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Autowired
    MessageQueue messageQueue;

    @Value("${org.o2e.test.messageQueue.numMessagesPerIteration}")
    int numMessagesPerIteration;

    @Value("${org.o2e.test.messageQueue.numClients}")
    int numClients;

    @Value("${org.o2e.test.messageQueue.testTtlMillis}")
    long testTtlMillis;

    @Value("${org.o2e.test.messageQueue.iterationMillis}")
    long iterationMillis;

    Set<String> clients = new ConcurrentHashSet<String>();

    @Before
    public void setup() {
        for (int i = 0; i < numClients; i++) {
            clients.add(RandomStringUtils.randomAlphanumeric(10));
        }
    }

    @Test
    public void testQueue() throws InterruptedException {
        log.info("Starting to queue messages...");
        long start = new Date().getTime();
        while (new Date().getTime() - start < testTtlMillis) {
            log.info("Producing a new batch...");
            for (int i = 0; i < numMessagesPerIteration; i++) {
                for (String client : clients) {
                    messageQueue.push(client, newRandomObject());
                }
            }
            Thread.sleep(iterationMillis);
        }
        log.info("Done.");
    }

    public static Map newRandomObject() {
        Map<String, String> map = new ConcurrentHashMap<String, String>();
        map.put("val1", RandomStringUtils.randomAlphanumeric(14));
        map.put("val2", RandomStringUtils.randomAlphanumeric(7));
        return map;
    }
}
