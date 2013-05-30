package org.o2e.test.cache;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.camel.cache.OoeDataCache;
import org.o2e.camel.cache.memcached.MemcachedDataCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.util.Date;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/13/12
 * Time: 2:02 PM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:cache-test.xml")
public class MemcachedDataCacheTest extends OoeCacheBaseTest {

    @Autowired
    MemcachedDataCache memcachedDataCache;

    @Override
    protected OoeDataCache getDataCache() {
        return memcachedDataCache;
    }

}
