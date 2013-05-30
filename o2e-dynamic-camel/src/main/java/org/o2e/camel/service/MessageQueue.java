package org.o2e.camel.service;

import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 12/14/12
 * Time: 10:16 AM
 * To change this template use File | Settings | File Templates.
 */
public interface MessageQueue {

    public boolean push(String sessionId, Map data);

    public void flush();

}
