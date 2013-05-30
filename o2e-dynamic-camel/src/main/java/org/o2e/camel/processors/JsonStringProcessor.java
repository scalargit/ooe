package org.o2e.camel.processors;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.camel.Exchange;
import org.apache.camel.Message;
import org.apache.camel.Processor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/15/11
 * Time: 6:00 PM
 * To change this template use File | Settings | File Templates.
 */
public class JsonStringProcessor implements Processor {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    public static final String RESPONSE_PARAM = "response";

    public void process(Exchange exchange) throws Exception {
        Message in = exchange.getIn();
        String body = in.getBody(String.class);
        if (body != null && body.length() > 0) {
            Object jsonObj = JSON.parse(body);
            if (jsonObj instanceof DBObject) {
                in.setBody(jsonObj);
            }
            else {
                log.warn("Could not parse message body into JSON: '" + body + "'");
                in.setBody(body);
            }
        }
    }

}
