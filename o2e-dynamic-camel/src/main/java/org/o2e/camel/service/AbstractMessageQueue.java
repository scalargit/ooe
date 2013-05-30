package org.o2e.camel.service;

import com.google.common.collect.Sets;
import org.eclipse.jetty.util.ConcurrentHashSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.task.TaskExecutor;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 12/14/12
 * Time: 10:18 AM
 * To change this template use File | Settings | File Templates.
 */
public abstract class AbstractMessageQueue implements MessageQueue {

    final protected Logger log = LoggerFactory.getLogger(this.getClass());

    // Store one message queue per session in order to optimize delivery fairness & efficiency
    protected ConcurrentHashMap<String, ConcurrentLinkedQueue<CometMessage>> queueMap =
            new ConcurrentHashMap<String, ConcurrentLinkedQueue<CometMessage>>();

    // Store payloads separately to avoid duplicate objects in memory
    protected ConcurrentHashMap<Integer, PayloadWrapper> payloads = new ConcurrentHashMap<Integer, PayloadWrapper>();

    public abstract void doSend(final String sessionId, final Map data);

    public abstract TaskExecutor getTaskExecutor();

    public boolean push(String sessionId, Map message) {
        ConcurrentLinkedQueue<CometMessage> queue = queueMap.get(sessionId);
        if (queue == null) queue = new ConcurrentLinkedQueue<CometMessage>();
        boolean accepted = queue.offer(new CometMessage(sessionId, message.hashCode()));
        if (accepted) {
            PayloadWrapper payloadWrapper = payloads.get(message.hashCode());
            if (payloadWrapper == null) payloadWrapper = new PayloadWrapper(message, Sets.newHashSet(sessionId));
            else payloadWrapper.addSessionId(sessionId);
            payloads.putIfAbsent(message.hashCode(), payloadWrapper);
        }
        queueMap.put(sessionId, queue);
        return accepted;
    }


    public void flush() {
        if (log.isTraceEnabled()) log.trace("Looking for outbound messages...");
        for (final String sessionId : queueMap.keySet()) {
            final ConcurrentLinkedQueue<CometMessage> queue = queueMap.get(sessionId);
            if (queue != null) {
                // Spin up one thread per active session
                getTaskExecutor().execute(new Runnable() {
                    public void run() {
                        int numMessages = 0;
                        for (CometMessage cometMessage; (cometMessage = queue.poll()) != null; ) {
                            PayloadWrapper payloadWrapper = payloads.get(cometMessage.getPayloadHash());
                            Map data = payloadWrapper.getData();
                            doSend(sessionId, data);
                            payloadWrapper.removeSessionId(cometMessage.getSessionId());
                            numMessages++;
                        }
                        if (numMessages > 0 && log.isDebugEnabled()) log.debug("Sent " + numMessages + " message(s).");
                    }
                });
            }
        }
    }

    public void garbageCollect() {
        if (log.isDebugEnabled()) log.debug("Running garbage collection on " + payloads.size() + " payload(s).");
        Set<Integer> hashesToRemove = new ConcurrentHashSet<Integer>();
        for (Map.Entry<Integer, PayloadWrapper> entry : payloads.entrySet()) {
            if (entry.getValue().getSessionIds().isEmpty()) {
                hashesToRemove.add(entry.getKey());
            }
        }
        if (!hashesToRemove.isEmpty()) {
            log.info("Removing " + hashesToRemove.size() + " payload(s).");
            for (int hashcode : hashesToRemove) {
                payloads.remove(hashcode);
            }
        }
    }

    public class PayloadWrapper {

        Map data;
        Set<String> sessionIds;

        public PayloadWrapper(Map data, Set<String> sessionIds) {
            this.data = data;
            this.sessionIds = sessionIds;
        }

        public PayloadWrapper() {
        }

        public void addSessionId(String sessionId) {
            if (sessionIds == null) sessionIds = new ConcurrentHashSet<String>();
            sessionIds.add(sessionId);
        }

        public void removeSessionId(String sessionId) {
            if (sessionIds != null) sessionIds.remove(sessionId);
        }

        public Map getData() {
            return data;
        }

        public void setData(Map data) {
            this.data = data;
        }

        public Set<String> getSessionIds() {
            return sessionIds;
        }

        public void setSessionIds(Set<String> sessionIds) {
            this.sessionIds = sessionIds;
        }
    }


}
