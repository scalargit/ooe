package org.o2e.test.cache;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.camel.cache.MongoDataCache;
import org.o2e.camel.cache.OoeDataCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.Date;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/12/12
 * Time: 5:22 PM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:cache-test.xml")
public class MongoDataCacheTest extends OoeCacheBaseTest {

    @Autowired
    MongoDataCache mongoDataCache;

    @Override
    protected OoeDataCache getDataCache() {
        return mongoDataCache;
    }

}
