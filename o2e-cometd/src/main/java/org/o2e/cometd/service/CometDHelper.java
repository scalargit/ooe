package org.o2e.cometd.service;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.ServerMessage;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.java.annotation.Session;
import org.o2e.mongo.MongoHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/26/11
 * Time: 11:21 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
@org.cometd.java.annotation.Service("cometDHelper")
public class CometDHelper {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    public static final String PAGE_NUMBER_PARAM = "pageNumber";
    public static final String PAGE_SIZE_PARAM = "pageSize";
    public static final String QUERY_PARAM = "query";
    public static final String RECORDS_PARAM = "records";
    public static final String RECORD_PARAM = "record";
    public static final Integer PAGE_SIZE_DEFAULT = 10;

    @Session
    ServerSession serverSession;

    @Inject
    MongoHelper mongoHelper;

    public void handleQuery(ServerSession remote, ServerMessage message, String collection) {
        try {
            Map<String, Object> messageData = message.getDataAsMap();
            String pageSizeStr = (String) messageData.get(PAGE_SIZE_PARAM);
            String pageNumberStr = (String) messageData.get(PAGE_NUMBER_PARAM);
            Object queryObj = messageData.get(QUERY_PARAM);
            Map<String, Object> query = (queryObj != null && queryObj instanceof Map) ? (Map<String, Object>) queryObj : null;
            Integer pageNumber = (pageNumberStr == null) ? 0 : new Integer(pageNumberStr);
            Integer pageSize = (pageSizeStr == null) ? PAGE_SIZE_DEFAULT : new Integer(pageSizeStr);

            BasicDBList records = new BasicDBList();
            DBCursor cursor = mongoHelper.queryCollection(collection, query, pageNumber, pageSize);
            while (cursor != null && cursor.hasNext()) {
                DBObject result = cursor.next();
                DBObject record = new BasicDBObject();
                record.put(RECORD_PARAM, result);
                records.add(record);
            }
            DBObject payload = new BasicDBObject();
            payload.put(RECORDS_PARAM, records);
            sendReply(serverSession, remote, message.getChannel(), message.getId(),
                    payload, "Successfully queried collection '" + collection + "'", HttpStatus.SC_OK, false);
        } catch (Exception e) {
            String statusMessage = "Error while querying: " + e.getMessage();
            log.error(statusMessage, e);
            sendReply(serverSession, remote, message.getChannel(), message.getId(),
                    new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR, false);
        }
    }

    /**
     * Verifies that a given ServerMessage data map contains the given parameter. If not, send a reply to the client
     * indicating the problem and return false. Otherwise return true.
     *
     * @param serverSession
     * @param remote
     * @param message
     * @param parameterName
     * @return
     */
    public boolean verifyParameter(ServerSession serverSession, ServerSession remote, ServerMessage message,
                                   String parameterName) {
        return verifyParameter(serverSession, remote, message, message.getDataAsMap(), parameterName);
    }

    public boolean verifyParameter(ServerSession serverSession, ServerSession remote, ServerMessage message,
                                   Map map, String parameterName) {
        Object parameter = map.get(parameterName);
        if (parameter != null) return true;
        else {
            sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                    "Error: expected parameter '" + parameterName + "' to be supplied.", HttpStatus.SC_BAD_REQUEST, false);
            return false;
        }
    }

//    private static String parseParameter(String parameterName) {
//        if (parameterName != null && parameterName.contains(".")) return parameterName.substring(0, parameterName.indexOf("."));
//        else return parameterName;
//    }

    public void sendToDataChannel(ServerSession serverSession, ServerSession remote, String messageId,
                                  DBObject data, String statusMessage, int statusCode) {
        sendReply(serverSession, remote, getDataChannel(remote), messageId, data, statusMessage, statusCode, true);
    }

    @Async
    public void sendReply(ServerSession serverSession, ServerSession remote, String channel, String messageId,
                          DBObject data, String statusMessage, int statusCode) {
        sendReply(serverSession, remote, channel, messageId, data, statusMessage, statusCode, false);
    }

    @Async
    public void sendReply(ServerSession serverSession, ServerSession remote, String channel, String messageId,
                          DBObject data, String statusMessage, int statusCode, boolean isLazy) {
        // TODO: break this out into a multi-threaded delivery
        ServiceResponseMessage forward = new ServiceResponseMessage();
        forward.setChannel(channel);
        forward.setId(messageId);
        forward.setData(data);
        forward.setMessage(statusMessage);
        forward.setStatusCode(statusCode);
        forward.setLazy(isLazy);
        if (log.isTraceEnabled())
            log.trace("Delivering response for client id '" + remote.getId() + "' to channel '" + forward.getChannel() +
                    "', message: '" + JSON.serialize(forward) + "'");
        remote.deliver(serverSession, forward);
    }

    public String getDataChannel(ServerSession remote) {
        return "/data/" + remote.getId();
    }

    public void fixArrays(Map map) {
        List keysToRemove = new ArrayList();
        Map entriesToAdd = new HashMap();
        for (Object o : map.entrySet()) {
            Map.Entry entry = (Map.Entry) o;
            if (entry.getValue() instanceof Object[]) {
                Object[] array = (Object[]) entry.getValue();
                List list = new ArrayList();
                Collections.addAll(list, array);
                keysToRemove.add(entry.getKey());
                entriesToAdd.put(entry.getKey(), list);
                for (Object listObject : list) {
                    if (listObject instanceof Map) fixArrays((Map) listObject);
                }
            } else if (entry.getValue() instanceof List) {
                for (Object listObject : ((List) entry.getValue())) {
                    if (listObject instanceof Map) fixArrays((Map) listObject);
                }
            } else if (entry.getValue() instanceof Map) {
                fixArrays((Map) entry.getValue());
            }
        }

        for (Object key : keysToRemove) {
            map.remove(key);
        }

        map.putAll(entriesToAdd);
    }

}
