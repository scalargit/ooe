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
 * Date: 2/17/12
 * Time: 4:12 PM
 * To change this template use File | Settings | File Templates.
 */
public class PrestoResponseProcessor implements Processor {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    public static final String RESPONSE_PARAM = "response";

    public void process(Exchange exchange) throws Exception {
        Message in = exchange.getIn();
        String body = in.getBody(String.class);
        if (body != null && body.length() > 0) {
            Object outer = JSON.parse(body);
            if (outer instanceof DBObject) {
                Object response = ((DBObject) outer).get(RESPONSE_PARAM);
                if (response instanceof String) {
                    try {
                        Object json = JSON.parse((String) response);
                        if (json instanceof DBObject) {
                            ((DBObject) outer).put(RESPONSE_PARAM, json);
                            in.setBody(outer);
                        }
                        else in.setBody(outer);
                    } catch (Exception e) {
                        in.setBody(outer);
                    }
                }
                else in.setBody(outer);
                in.setBody(outer);
            }
            else {
                log.warn("Could not parse message body into JSON: '" + body + "'");
                in.setBody(body);
            }
        }
    }

}
