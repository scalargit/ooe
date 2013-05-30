package org.o2e.cometd.service;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.*;
import org.cometd.java.annotation.Configure;
import org.cometd.java.annotation.Listener;
import org.cometd.java.annotation.Session;
import org.o2e.cometd.security.AbstractAuthenticator;
import org.o2e.mongo.BeanValidator;
import org.o2e.mongo.WidgetMetadataRepository;
import org.o2e.mongo.cache.MetadataCache;
import org.o2e.mongo.pojo.WidgetMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.security.core.Authentication;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import javax.validation.ConstraintViolation;
import java.util.Date;
import java.util.Map;
import java.util.Set;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/26/11
 * Time: 2:16 PM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
@org.cometd.java.annotation.Service("widget")
public class WidgetMetadataService {

    final Logger log = LoggerFactory.getLogger(this.getClass());
    public static final String ID_PARAM = "id";
    public static final String WIDGET_METADATA_COLLECTION = "widgetMetadata";

    @Inject
    Authorizer authorizer;

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    MongoOperations mongoOperations;

    @Inject
    BeanValidator beanValidator;

    @Inject
    WidgetMetadataRepository widgetMetadataRepository;

    @Inject
    CometDHelper cometDHelper;

    @Autowired
    protected MetadataCache metadataCache;

    @Configure("/service/widget/**")
    protected void configure(ConfigurableServerChannel channel) {
        channel.addAuthorizer(authorizer);
        channel.setPersistent(true);
    }

    @Listener("/service/widget/save")
    public void save(ServerSession remote, ServerMessage message) {
        try {
            Map<String, Object> messageData = message.getDataAsMap();
            // TODO: remove call to cometDHelper.fixArrays when Spring Data fixes Object[] persistence bug
            cometDHelper.fixArrays(messageData);

            BasicDBObject dbObject = new BasicDBObject(messageData);
            WidgetMetadata widgetMetadata = mongoOperations.getConverter().read(WidgetMetadata.class, dbObject);

            Authentication authentication = (Authentication) remote.getAttribute(AbstractAuthenticator.AUTH_DATA);
            long now = new Date().getTime();
            widgetMetadata.setLastUpdatedTime(now);
            widgetMetadata.setLastUpdatedBy(authentication.getName());
            if (widgetMetadata.getId() == null || widgetMetadata.getId().length() == 0) {
                widgetMetadata.setCreatedTime(now);
                widgetMetadata.setCreator(authentication.getName());
            }

            // Perform validation and report errors if any found; otherwise save new serviceSpecification
            Set<ConstraintViolation<WidgetMetadata>> violations = beanValidator.validate(widgetMetadata);
            if (violations.isEmpty()) {
                WidgetMetadata saved = widgetMetadataRepository.save(widgetMetadata);
                String documentAsString = mongoOperations.getConverter().convertToMongoType(saved).toString();
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        (DBObject) JSON.parse(documentAsString), "WidgetMetadata saved successfully.", HttpStatus.SC_OK);
            } else {
                String statusMessage = "";
                for (ConstraintViolation<WidgetMetadata> violation : violations) {
                    statusMessage += "Attribute " + violation.getPropertyPath() + " " + violation.getMessage() +
                            " (Invalid value was '" + violation.getInvalidValue() + "'). ";
                }
                log.debug("Validation error for client with id '" + remote.getId() + "': " + statusMessage);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_BAD_REQUEST);
            }
        } catch (Exception e) {
            String statusMessage = "Error while saving widget metadata.";
            log.error(statusMessage, e);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                    new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
        }

    }

    @Listener("/service/widget/get")
    public void get(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, ID_PARAM)) {
            String id = (String) message.getDataAsMap().get(ID_PARAM);
            try {
                WidgetMetadata widgetMetadata = metadataCache.getWidgetMetadata(id);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        toDBObject(widgetMetadata), "Widget Metadata with id '" + id + "' fetched successfully.",
                        HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error fetching widget metadata with id '" + id + "'.";
                log.error(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Listener("/service/widget/remove")
    public void remove(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, ID_PARAM)) {
            String id = (String) message.getDataAsMap().get(ID_PARAM);
            try {
                widgetMetadataRepository.delete(id);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), "Widget Metadata with id '" + id + "' removed successfully.",
                        HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error deleting widget metadata with id '" + id + "'.";
                log.error(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Listener("/service/widget/findAll")
    public void findAll(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, CometDHelper.QUERY_PARAM)) {
            Map<String, Object> query = (Map<String, Object>) message.getDataAsMap().get(CometDHelper.QUERY_PARAM);
            if (cometDHelper.verifyParameter(serverSession, remote, message, query, CometDHelper.PAGE_NUMBER_PARAM) &&
                    cometDHelper.verifyParameter(serverSession, remote, message, query, CometDHelper.PAGE_SIZE_PARAM)) {
                try {
                    BasicDBList results = new BasicDBList();
                    Integer pageNumber = new Integer((String) query.get(CometDHelper.PAGE_NUMBER_PARAM));
                    Integer pageSize = new Integer((String) query.get(CometDHelper.PAGE_SIZE_PARAM));
                    Iterable<WidgetMetadata> widgetMetadatas = widgetMetadataRepository.findAll(
                            new PageRequest(pageNumber, pageSize));
                    for (WidgetMetadata widgetMetadata : widgetMetadatas) {
                        results.add(toDBObject(widgetMetadata));
                    }
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), results,
                            "WidgetMetadata findAll request successful.", HttpStatus.SC_OK);
                } catch (Exception e) {
                    String statusMessage = "Error in findAll request";
                    log.error(statusMessage, e);
                    cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                            new BasicDBObject(), statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
                }
            }
        }
    }

    @Listener("/service/widget/find")
    public void find(ServerSession remote, ServerMessage message) {
        cometDHelper.handleQuery(remote, message, WIDGET_METADATA_COLLECTION);
    }

    private DBObject toDBObject(WidgetMetadata widgetMetadata) {
        String json = mongoOperations.getConverter().convertToMongoType(widgetMetadata).toString();
        return (DBObject) JSON.parse(json);
    }

}
