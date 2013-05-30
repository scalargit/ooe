package org.o2e.camel.cache;

import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoOperations;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Update.update;
import static org.springframework.data.mongodb.core.query.Query.query;

import java.util.Date;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/12/12
 * Time: 3:52 PM
 * To change this template use File | Settings | File Templates.
 */
public class MongoDataCache extends AbstractOoeDataCache {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    public static final String DATA_COLLECTION_NAME = "data";
    public static final String KEY_PARAM = "key";
    public static final String VALUE_PARAM = "value";
    public static final String LAST_UPDATED_PARAM = "lastUpdated";

    @Autowired
    MongoOperations mongoOperations;

    @Override
    public void doPut(String key, String value) throws Exception {
        log.trace("Writing mapping '" + key + "' -> '" + value + "' to cache.");
        DBCollection dataCollection = mongoOperations.getCollection(DATA_COLLECTION_NAME);
        DBObject element = find(key);
        if (element == null) element = new BasicDBObject();
        element.put(KEY_PARAM, key);
        element.put(VALUE_PARAM, value);
        element.put(LAST_UPDATED_PARAM, new Date().getTime());
        dataCollection.save(element);
    }

    public String get(String key, long millis) {
        DBObject dbObject = find(key);
        if (dbObject != null) {
            if (minimumRefreshIntervalSeconds * 1000 > millis) millis = minimumRefreshIntervalSeconds;
            long lastUpdateTime = (Long) dbObject.get(LAST_UPDATED_PARAM);
            if (new Date().getTime() < (lastUpdateTime + millis)) {
                log.trace("Found non-stale data in cache for ServiceSpecification with id '" + key + "'");
                return (String) dbObject.get(VALUE_PARAM);
            }
        }
        return null;
    }

    private DBObject find(String key) {
        return mongoOperations.findOne(query(where(KEY_PARAM).is(key)), BasicDBObject.class);
    }

    public void delete(String key) throws Exception {
        mongoOperations.findAndRemove(query(where(KEY_PARAM).is(key)), BasicDBObject.class);
    }

}
