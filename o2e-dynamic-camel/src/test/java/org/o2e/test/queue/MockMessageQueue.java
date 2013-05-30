package org.o2e.test.queue;

import org.o2e.camel.service.AbstractMessageQueue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 12/14/12
 * Time: 10:32 AM
 * To change this template use File | Settings | File Templates.
 */
public class MockMessageQueue extends AbstractMessageQueue {

    @Value("${org.o2e.test.messageQueue.latency}")
    int messageLatency;

    @Autowired
    @Qualifier("consumer")
    TaskExecutor consumer;

    @Override
    public TaskExecutor getTaskExecutor() {
        return consumer;
    }

    @Override
    public void doSend(String sessionId, Map data) {
        try {
            log.trace("Sending message with hash '" + data.hashCode() + "' to session '" + sessionId +
                    "' and sleeping for " + messageLatency + " ms.");
            Thread.sleep(messageLatency);
            log.trace("Sent message with hash '" + data.hashCode() + "' to session '" + sessionId + "'.");
        } catch (InterruptedException e) {
            log.error("Interrupted.", e);
        }
    }

    @Scheduled(fixedDelay = 5000)
    @Override
    public void flush() {
        super.flush();
    }

    @Scheduled(fixedDelay = 3000)
    @Override
    public void garbageCollect() {
        super.garbageCollect();
    }
}
