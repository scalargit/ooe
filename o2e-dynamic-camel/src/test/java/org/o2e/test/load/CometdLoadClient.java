package org.o2e.test.load;

import org.o2e.test.cometd.CometDTestConfig;
import org.o2e.test.cometd.CometdBaseTest;
import org.o2e.test.cometd.DataGetListener;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/19/12
 * Time: 5:03 PM
 * To change this template use File | Settings | File Templates.
 */
public class CometdLoadClient extends CometdBaseTest {

    CometDTestConfig cometDTestConfig;
    DataGetListener dataGetListener;

    public CometdLoadClient(CometDTestConfig cometDTestConfig) {
        this.cometDTestConfig = cometDTestConfig;
    }

    @Override
    public CometDTestConfig getConfig() {
//        CometDTestConfig config = new CometDTestConfig();
//        config.setCometdUrl("https://localhost:8443/sw-server/cometd");
//        return config;
        return cometDTestConfig;
    }

    public DataGetListener getDataGetListener() {
        return dataGetListener;
    }

    public void setDataGetListener(DataGetListener dataGetListener) {
        this.dataGetListener = dataGetListener;
    }
}
