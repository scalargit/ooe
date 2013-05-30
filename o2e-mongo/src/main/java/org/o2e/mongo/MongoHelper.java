package org.o2e.mongo;

import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/9/11
 * Time: 1:20 PM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
public class MongoHelper {

    @Inject
    MongoOperations mongoOperations;

    public DBCursor queryCollection(String collection, Map query, int pageNumber, int pageSize) {
        if (query != null) convertIds(query);
        if (!mongoOperations.collectionExists(collection)) return null;
        DBCollection dbCollection = mongoOperations.getCollection(collection);
        if (query != null) return dbCollection.find(new BasicDBObject(query)).limit(pageSize).skip(pageNumber * pageSize);
        else return dbCollection.find().limit(pageSize).skip(pageNumber * pageSize);
    }

    /**
     * If query map contains an 'id' entry of type String, convert it to ObjectId
     * @param map
     */
    private void convertIds(Map map) {
        Object id = map.get("_id");
        if (id != null && id instanceof String) {
            map.put("_id", new ObjectId((String) id));
        }
    }

}
