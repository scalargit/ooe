package org.o2e.test.cometd;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.cometd.bayeux.Message;

import javax.inject.Named;
import javax.inject.Singleton;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/22/11
 * Time: 9:48 AM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
public class CometDTestHelper {

    public Object extractDataObject(Message message) {
        return getMessageObject(message).get("data");
    }

    public DBObject getMessageObject(Message message) {
        String json = message.getJSON();
        return (DBObject) JSON.parse(json);
    }

}
