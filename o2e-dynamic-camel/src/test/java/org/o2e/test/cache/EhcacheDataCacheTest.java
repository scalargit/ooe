package org.o2e.test.cache;

import org.junit.runner.RunWith;
import org.o2e.camel.cache.EhCacheDataCache;
import org.o2e.camel.cache.OoeDataCache;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/14/12
 * Time: 3:22 PM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:cache-test.xml")
public class EhcacheDataCacheTest extends OoeCacheBaseTest {

    @Autowired
    EhCacheDataCache ehCacheDataCache;

    @Override
    protected OoeDataCache getDataCache() {
        return ehCacheDataCache;
    }

}
