package org.o2e.test.cache;

import org.junit.Test;
import org.o2e.camel.cache.OoeDataCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/14/12
 * Time: 3:07 PM
 * To change this template use File | Settings | File Templates.
 */
public abstract class OoeCacheBaseTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());
    enum Operation {get, set, delete}
    int records = 1000000;
    int defaultRefreshRate = 1000 * 60 * 60 * 24;
    String keyPrefix = "testkey";
    String valuePrefix = "testval";

    protected abstract OoeDataCache getDataCache();

    @Test
    public void stressTest() throws Exception {
        doTest(Operation.set, records, 1000 * 60 * 60);
        doTest(Operation.get, records, 1000 * 60 * 60);
        doTest(Operation.delete, records, 1000 * 60 * 60);
    }

    public void doTest(Operation operation, int records, int refreshRate) throws Exception {
        long start = new Date().getTime();
        int hits = 0;
        if (refreshRate < 1) refreshRate = defaultRefreshRate;
        for (int i = 0; i < records; i++) {
            if (Operation.get.equals(operation)) {
                String data = getDataCache().get(keyPrefix + i, refreshRate);
                if (data != null) hits++;
            }
            else if (Operation.set.equals(operation)) {
                getDataCache().put(keyPrefix + i, valuePrefix + i);
            }
            else if (Operation.delete.equals(operation)) {
                getDataCache().delete(keyPrefix + i);
            }
        }
        long end = new Date().getTime();
        String msg = "Performed operation '" + operation + "' on ";
        if (Operation.get.equals(operation)) msg+= hits + " of ";
        msg += records + " record(s) in " + (end - start) + " ms.";
        log.info(msg);
    }

}
