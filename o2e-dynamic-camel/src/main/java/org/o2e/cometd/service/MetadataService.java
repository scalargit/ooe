package org.o2e.cometd.service;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.*;
import org.cometd.java.annotation.Configure;
import org.cometd.java.annotation.Listener;
import org.cometd.java.annotation.Session;
import org.o2e.camel.ServiceRegistry;
import org.o2e.mongo.BeanValidator;
import org.o2e.mongo.ServiceRepository;
import org.o2e.mongo.cache.MetadataCache;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoOperations;

import javax.annotation.Nullable;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import javax.validation.ConstraintViolation;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * <p>MetadataService exposes metadata housed in a database as bayeux services.
 * Interaction with the metadata repository (database) is performed via the
 * connector. The
 * MetadataService allows for interaction with the metadata repository on the
 * /service/metadata channels and also for automatic notifications on insert,
 * update and remove actions on the /metadata channels.</p>
 * <p/>
 * <p>CRUD operations on the metadata repository:</p>
 * <ul>
 * <li>/service/metadata/get: channel for getting existing services</li>
 * <li>/service/metadata/findByName: channel for finding services by their name (supports pagination)</li>
 * <li>/service/metadata/findByDataType: channel for finding services by their camelComponent (supports pagination)</li>
 * <li>/service/metadata/findAll: channel for finding all services (supports pagination)</li>
 * <li>/service/metadata/insert: channel for inserting new services</li>
 * <li>/service/metadata/update: channel for updating existing services</li>
 * <li>/service/metadata/remove: channel for removing existing services</li>
 * </ul>
 * <p/>
 * <p>For metadata notifications will take place on the following base channels:</p>
 * <ul>
 * <li>/metadata/insert/*: insert notifications</li>
 * <li>/metadata/update/**: update notifications</li>
 * <li>/metadata/remove/**: remove notifications</li>
 * </ul>
 * <p/>
 * <p>More specific subscriptions can be made based on the metadata type (which
 * maps to a particular table/collection in the repository) and in the case of
 * update or remove operations, on the particular records effected.</p>
 * <p/>
 * <p>For insert operations for instance you can listen for just serviceSpecification metadata
 * changes on /metadata/insert/services.</p>
 * <p/>
 * <p>For update operations you can listen for just serviceSpecification metadata updates
 * on /metadata/update/services or for a particular serviceSpecification based on the
 * id of the serviceSpecification, e.g. /metadata/update/services/19.</p>
 * <p/>
 * <p>Remove operations function identically to update operations, just on
 * the remove channels, e.g. /metadata/remove/services/19.</p>
 * <p/>
 * <p>The actual metadata types are not managed in code and are explained in
 * detail in the O2E Admin and Developer documentation.</p>
 *
 * @author aaronsmith
 */
@Named
@Singleton
@org.cometd.java.annotation.Service("metadata")
public class MetadataService {

    Logger log = LoggerFactory.getLogger(this.getClass());
    public static final String SERVICE_NAME = "metadata";
    public static final String RESULTS_PARAM = "results";
    public static final String ID_PARAM = "id";
    public static final String NAME_QUERY_PARAM = "name";
    public static final String DATA_TYPE_QUERY_PARAM = "dataType";
    public static final String SERVICE_SPECIFICATION_COLLECTION = "serviceSpecification";

    @Inject
    Authorizer authorizer;

    @Inject
    BayeuxServer bayeux;

    @Inject
    MongoOperations mongoOperations;

    @Inject
    ServiceRepository serviceRepository;

    @Inject
    ServiceRegistry serviceRegistry;

    @Session
    ServerSession serverSession;

    @Inject
    BeanValidator beanValidator;

    @Inject
    CometDHelper cometDHelper;

    @Autowired
    protected MetadataCache metadataCache;

    @PostConstruct
    public void init() {
        log.info("Metadata ServiceSpecification Initialized");
    }

    @Configure("/service/" + SERVICE_NAME + "/**")
    protected void configureMetadataService(ConfigurableServerChannel channel) {
        channel.addAuthorizer(authorizer);
        channel.setPersistent(true);
    }


    /**
     * The get operation exposed on /serviceSpecification/metadata/get. This method is not
     * intended to be called directly.
     *
     * @param remote  The serverSession for the publisher
     * @param message The message published
     */
    @Listener("/service/" + SERVICE_NAME + "/get")
    public void get(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, ID_PARAM)) {
            Map<String, Object> data = message.getDataAsMap();
            String id = (String) data.get(ID_PARAM);
            try {
                ServiceSpecification serviceSpecification = metadataCache.getServiceSpecification(id);
                String json = mongoOperations.getConverter().convertToMongoType(serviceSpecification).toString();
                DBObject savedDbObject = (DBObject) JSON.parse(json);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), savedDbObject,
                        "Get issued successfully.", HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error retrieving ServiceSpecification with id '" + id + "'";
                log.error(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    /**
     * @param remote  The serverSession for the publisher
     * @param message The message published
     */
    @Listener("/service/" + SERVICE_NAME + "/findByName")
    public void findByName(ServerSession remote, ServerMessage message) {
        doFind(remote, message, NAME_QUERY_PARAM);
    }

    /**
     * @param remote  The serverSession for the publisher
     * @param message The message published
     */
    @Listener("/service/" + SERVICE_NAME + "/findByDataType")
    public void findByDataType(ServerSession remote, ServerMessage message) {
        doFind(remote, message, DATA_TYPE_QUERY_PARAM);
    }

    /**
     * @param remote  The serverSession for the publisher
     * @param message The message published
     */
    // TODO: Don't return full ServiceSpecification objects here (references instead)
    @Listener("/service/" + SERVICE_NAME + "/findAll")
    public void findAll(ServerSession remote, ServerMessage message) {
        doFind(remote, message, null);
    }

    public void doFind(ServerSession remote, ServerMessage message, @Nullable String queryBy) {
        log.debug("Invoking metadata find call for serviceSpecification for session id '" + remote.getId() + "', querying by '" +
                queryBy + "'");
        Map<String, Object> data = message.getDataAsMap();
        if (cometDHelper.verifyParameter(serverSession, remote, message, cometDHelper.PAGE_NUMBER_PARAM) &&
                cometDHelper.verifyParameter(serverSession, remote, message, cometDHelper.PAGE_SIZE_PARAM)) {
            try {
                DBObject container = new BasicDBObject();
                List<DBObject> results = new ArrayList<DBObject>();
                Iterable<ServiceSpecification> services = null;
                Integer pageSize = new Integer((String) data.get(cometDHelper.PAGE_SIZE_PARAM));
                Integer pageNumber = new Integer((String) data.get(cometDHelper.PAGE_NUMBER_PARAM));
                if (NAME_QUERY_PARAM.equalsIgnoreCase(queryBy) &&
                        cometDHelper.verifyParameter(serverSession, remote, message, NAME_QUERY_PARAM))
                    services = serviceRepository.findByName((String) data.get(NAME_QUERY_PARAM), new PageRequest(pageNumber, pageSize));
                else if (DATA_TYPE_QUERY_PARAM.equalsIgnoreCase(queryBy) &&
                        cometDHelper.verifyParameter(serverSession, remote, message, DATA_TYPE_QUERY_PARAM))
                    services = serviceRepository.findByDataType((String) data.get(DATA_TYPE_QUERY_PARAM), new PageRequest(pageNumber, pageSize));
                else
                    services = serviceRepository.findAll(new PageRequest(pageNumber, pageSize));
                for (ServiceSpecification serviceSpecification : services) {
                    String json = mongoOperations.getConverter().convertToMongoType(serviceSpecification).toString();
                    DBObject dbObject = (DBObject) JSON.parse(json);
                    results.add(dbObject);
                }
                container.put(RESULTS_PARAM, results);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), container,
                        "Query issued successfully.", HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error while querying for ServiceSpecifications.";
                log.error(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Listener("/service/" + SERVICE_NAME + "/find")
    public void find(ServerSession remote, ServerMessage message) {
        cometDHelper.handleQuery(remote, message, SERVICE_SPECIFICATION_COLLECTION);
    }


    /**
     * @param remote  The serverSession for the publisher
     * @param message The message published
     */
    @Listener("/service/" + SERVICE_NAME + "/save")
    public void save(ServerSession remote, ServerMessage message) {
        try {
            // Read object as a generic ServiceSpecification first
            BasicDBObject dbObject = new BasicDBObject(message.getDataAsMap());
            ServiceSpecification serviceSpecification = mongoOperations.getConverter().read(ServiceSpecification.class, dbObject);

            // Use generic ServiceSpecification & ServiceRepository to determine which sub-class to read dbObject into
            Class<? extends ServiceSpecification> serviceClass = serviceRegistry.getServiceSubClass(serviceSpecification);
            ServiceSpecification asSubclassServiceSpecification = mongoOperations.getConverter().read(serviceClass, dbObject);

            // Perform validation and report errors if any found; otherwise save new serviceSpecification
            Set<ConstraintViolation<ServiceSpecification>> violations = beanValidator.validate(asSubclassServiceSpecification);
            if (violations.isEmpty()) {
                ServiceSpecification saved = serviceRepository.save(asSubclassServiceSpecification);
                String savedServiceString = mongoOperations.getConverter().convertToMongoType(saved).toString();
                log.debug("Saved ServiceSpecification '" + saved + "'");
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(),
                        (DBObject) JSON.parse(savedServiceString), "Save issued successfully.", HttpStatus.SC_OK);
            } else {
                String statusMessage = "";
                for (ConstraintViolation<ServiceSpecification> violation : violations) {
                    statusMessage += "Attribute " + violation.getPropertyPath() + " " + violation.getMessage() +
                            " (Invalid value was '" + violation.getInvalidValue() + "'). ";
                }
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_BAD_REQUEST);
            }
        } catch (Exception e) {
            String statusMessage = "Error while saving new ServiceSpecification.";
            log.error(statusMessage, e);
            cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                    statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * @param remote  The serverSession for the publisher
     * @param message The message published
     */
    @Listener("/service/" + SERVICE_NAME + "/remove")
    public void remove(ServerSession remote, ServerMessage message) {
        if (cometDHelper.verifyParameter(serverSession, remote, message, ID_PARAM)) {
            Map<String, Object> data = message.getDataAsMap();
            String id = (String) data.get(ID_PARAM);
            try {
                serviceRepository.delete(id);
                log.info("Deleted ServiceSpecification with id '" + id + "'");
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        "Remove issued successfully.", HttpStatus.SC_OK);
            } catch (Exception e) {
                String statusMessage = "Error removing ServiceSpecification with id '" + id + "'";
                log.error(statusMessage, e);
                cometDHelper.sendReply(serverSession, remote, message.getChannel(), message.getId(), new BasicDBObject(),
                        statusMessage, HttpStatus.SC_INTERNAL_SERVER_ERROR);
            }
        }
    }

}

