package org.o2e.test.cometd;

import org.cometd.bayeux.Message;
import org.cometd.bayeux.client.ClientSessionChannel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 12/8/11
 * Time: 4:36 PM
 * To change this template use File | Settings | File Templates.
 */
public class BlockingListener implements ClientSessionChannel.MessageListener {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    Lock lock = new ReentrantLock();
    Condition ready = lock.newCondition();
    Message message;
    long timeoutMillis = 1000 * 5;

    public BlockingListener() {}

    public BlockingListener(long timeoutMillis) {
        this.timeoutMillis = timeoutMillis;
    }

    public void onMessage(ClientSessionChannel clientSessionChannel, Message message) {
        log.info("Received message '" + message + "'");
        lock.lock();
        try {
            this.message = message;
            ready.signal();
        } finally {
            lock.unlock();
        }
    }

    public Message get() {
        lock.lock();
        try {
            log.trace("Awaiting signal...");
            ready.await(timeoutMillis, TimeUnit.MILLISECONDS);
            log.trace("Returning data.");
            return message;
        } catch (InterruptedException e) {
            log.trace("Interrupted. Returning message.");
            return message;
        } finally {
            lock.unlock();
            ready = lock.newCondition();
        }
    }

    public long getTimeoutMillis() {
        return timeoutMillis;
    }

    public void setTimeoutMillis(long timeoutMillis) {
        this.timeoutMillis = timeoutMillis;
    }
}
