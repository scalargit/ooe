package org.o2e.camel.service;

import com.mongodb.BasicDBObject;
import org.apache.http.HttpStatus;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.annotation.Session;
import org.o2e.cometd.service.CometDHelper;
import org.o2e.cometd.service.DataService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Component;

import javax.inject.Inject;
import java.util.Map;
import java.util.UUID;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 12/13/12
 * Time: 12:39 PM
 * To change this template use File | Settings | File Templates.
 */
@Component
@org.cometd.annotation.Service("cometMessageQueue")
public class CometMessageQueue extends AbstractMessageQueue {

    @Inject
    @Qualifier("cometTaskExecutor")
    TaskExecutor cometTaskExecutor;

    @Inject
    BayeuxServer bayeux;

    @Session
    ServerSession serverSession;

    @Inject
    CometDHelper cometDHelper;

    @Override
    public void doSend(final String sessionId, final Map data) {
        ServerSession remote = bayeux.getSession(sessionId);
        String serviceSpecificationId = (String) data.get(DataService.SERVICE_SPECIFICATION_ID_PARAM);
        if (remote != null) {
            cometDHelper.sendToDataChannel(serverSession, remote, UUID.randomUUID().toString(), new BasicDBObject(data),
                    "Data is available for ServiceSpecification with id '" + serviceSpecificationId + "'",
                    HttpStatus.SC_OK);
        } else log.info("Could not create ServerSession for CometD session id '" + sessionId + "'");
    }

    @Override
    public TaskExecutor getTaskExecutor() {
        return cometTaskExecutor;
    }

}
