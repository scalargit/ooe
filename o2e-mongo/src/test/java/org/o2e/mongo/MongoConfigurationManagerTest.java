package org.o2e.mongo;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 6/22/12
 * Time: 9:45 AM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-mongo-test.xml")
public class MongoConfigurationManagerTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Autowired
    ConfigurationManager configurationManager;

    @Test
    public void test() {
        String collection = "testcol1";
        String key = "color";
        String value = "orange";
        configurationManager.saveProperty(collection, key, value);
        String prop = (String) configurationManager.getProperty(collection, key);
        Assert.assertEquals(value, prop);
    }

}
