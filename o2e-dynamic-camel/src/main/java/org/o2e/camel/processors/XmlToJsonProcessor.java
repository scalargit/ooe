package org.o2e.camel.processors;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.camel.Exchange;
import org.apache.camel.Message;
import org.apache.camel.Processor;
import org.json.JSONObject;
import org.json.XML;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/23/11
 * Time: 5:59 PM
 * To change this template use File | Settings | File Templates.
 */
public class XmlToJsonProcessor implements Processor {

    public void process(Exchange exchange) throws Exception {
        Message in = exchange.getIn();
        String body = in.getBody(String.class);
        if (body != null && body.length() > 0 && body.charAt(0) == '<') {
            JSONObject jsonObject = XML.toJSONObject(body);
            Object obj = JSON.parse(jsonObject.toString());
            if (obj instanceof DBObject) {
                in.setBody(obj);
            }
        }
    }

}
