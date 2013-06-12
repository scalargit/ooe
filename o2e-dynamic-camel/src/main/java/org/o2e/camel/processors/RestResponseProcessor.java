package org.o2e.camel.processors;

import com.mongodb.DBObject;
import com.mongodb.util.JSON;
import org.apache.camel.Exchange;
import org.apache.camel.Message;
import org.apache.camel.Processor;
import org.o2e.mongo.annotations.MappedByDataType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 5/20/13
 * Time: 3:26 PM
 * To change this template use File | Settings | File Templates.
 */
@MappedByDataType("rest")
public class RestResponseProcessor extends AbstractOoeResponseProcessor {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    public void process(Exchange exchange) throws Exception {
        Message in = exchange.getIn();
        String body = in.getBody(String.class);
        if (body != null && body.length() > 0) {
            Object json = JSON.parse(body);
            if (json instanceof DBObject) {
                in.setBody(json);
            }
            else {
                log.warn("Could not parse message body into JSON: '" + body + "'");
                in.setBody(body);
            }
        }
    }
}
