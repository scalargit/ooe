package org.o2e.mongo;

import com.mongodb.BasicDBObject;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.inject.Inject;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 4/9/12
 * Time: 10:15 AM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-mongo-test.xml")
public class MongoHelperTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Inject
    MongoHelper mongoHelper;

    @Test
    public void queryTest() {
        String collection = "serviceSpecification";
        String id = "4f7f5949aa86d12ba8e151b5";
        Map<String, Object> query = new HashMap<String, Object>();
        query.put("_id", id);
        DBCursor cursor = mongoHelper.queryCollection(collection, query, 0, 10);
        while (cursor != null && cursor.hasNext()) {
            DBObject result = cursor.next();
            log.info(result.toString());
        }
    }

}
