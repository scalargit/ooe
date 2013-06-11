package org.o2e.cometd.service.collection;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.*;
import org.cometd.annotation.Session;
import org.o2e.cometd.service.CometDCrudServiceDelegate;
import org.o2e.cometd.service.CometDHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import javax.inject.Inject;
import java.util.Map;
import java.util.UUID;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 9/23/11
 * Time: 9:49 AM
 * To change this template use File | Settings | File Templates.
 */
@Component
public class CollectionServiceDelegate implements CometDCrudServiceDelegate {

    final Logger log = LoggerFactory.getLogger(this.getClass());
    public static final String ID_PARAM = "_id";
    public static final String UUID_PARAM = "uuid";
    public static final String COLLECTION_PARAM = "collection";

    @Inject
    MongoOperations mongoOperations;
    
    @Inject
    CometDHelper cometDHelper;

    public CollectionServiceDelegate() { }

    public Map<String, Object> save(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) throws Exception {
        if (cometDHelper.verifyParameter(serverSession, remote, message, COLLECTION_PARAM)) {
            try {
                Map<String, Object> messageData = message.getDataAsMap();
                cometDHelper.fixArrays(messageData);
                String collection = (String) messageData.get(COLLECTION_PARAM);
                String uuid = (String) messageData.get(UUID_PARAM);
                if (uuid == null) {
                    // Generate our own IDs here because 1) MongoTemplate.save() doesn't return one and
                    // 2) MongoTemplate doesn't seem to handle updates properly with auto-generated IDs
                    uuid = UUID.randomUUID().toString();
                    messageData.put(UUID_PARAM, uuid);
                }
                messageData.put(ID_PARAM, uuid);
                BasicDBObject data = new BasicDBObject(messageData);
                mongoOperations.getCollection(collection).save(data);
                String statusMessage = "Document with uuid '" + uuid + "' successfully saved to collection '" +
                        collection + "'";
                log.debug(statusMessage);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), data,
                        statusMessage, HttpStatus.SC_OK);
                return messageData;
            } catch (Exception e) {
                String statusMessage = "Error while saving document: " + e.getMessage();
//                log.error(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
                throw e;
            }
        }
        return null;
    }

    public Map<String, Object> get(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, UUID_PARAM) &&
                cometDHelper.verifyParameter(serverSession, remote, message, COLLECTION_PARAM)) {
            try {
                Map<String, Object> messageData = message.getDataAsMap();
                String uuid = (String) messageData.get(UUID_PARAM);
                String collection = (String) messageData.get(COLLECTION_PARAM);
                if (!mongoOperations.collectionExists(collection))
                    throw new IllegalArgumentException("Collection '" + collection + "' does not exist.");
                DBObject query = new Query(where(UUID_PARAM).is(uuid)).getQueryObject();
                DBObject data = mongoOperations.getCollection(collection).findOne(query);
//            data = mongoTemplate.findById(uuid, BasicDBObject.class, collection);
                if (data != null) {
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            data, "Successfully fetched document with uuid '" + uuid + "' in collection '" + collection +
                            "'", HttpStatus.SC_OK);
                }
                else {
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            new BasicDBObject(), "No document found in collection '" + collection + "' with uuid '" + uuid +
                            "'", HttpStatus.SC_INTERNAL_SERVER_ERROR);
                }
            } catch (Exception e) {
                String statusMessage = "Error while getting document: " + e.getMessage();
                log.error(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);

            }
        }
        return null;
    }

    public Map<String, Object> remove(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, UUID_PARAM) &&
                cometDHelper.verifyParameter(serverSession, remote, message, COLLECTION_PARAM)) {
            try {
                Map<String, Object> messageData = message.getDataAsMap();
                String uuid = (String) messageData.get(UUID_PARAM);
                String collection = (String) messageData.get(COLLECTION_PARAM);
                if (!mongoOperations.collectionExists(collection))
                    throw new IllegalArgumentException("Collection '" + collection + "' does not exist.");
                DBObject query = new Query(where(UUID_PARAM).is(uuid)).getQueryObject();
                DBObject data = mongoOperations.getCollection(collection).findOne(query);
                if (data != null) {
                    mongoOperations.getCollection(collection).remove(data);
                    String statusMessage = "Successfully removed document with uuid '" + uuid + "' in collection '" +
                            collection + "'";
                    log.debug(statusMessage);
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            new BasicDBObject(), statusMessage, HttpStatus.SC_OK);
                }
                else {
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            new BasicDBObject(), "No document found in collection '" + collection + "' with uuid '" + uuid +
                            "'", HttpStatus.SC_INTERNAL_SERVER_ERROR);
                }
            } catch (Exception e) {
                String statusMessage = "Error while getting document: " + e.getMessage();
                log.error(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
        return null;
    }

    public Map<String, Object> find(ServerSession remote, ServerMessage message, BayeuxServer bayeux,
                                    ServerSession serverSession) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, COLLECTION_PARAM)) {
            Map<String, Object> messageData = message.getDataAsMap();
            String collection = (String) messageData.get(COLLECTION_PARAM);
            cometDHelper.handleQuery(remote , message, collection);
        }
        return null;
    }

    /**
     * Determines if a given collection is allowed to be accessed by this service
     * @param collection
     */
    private boolean isAllowed(String collection) {
        return true;
    }
}
