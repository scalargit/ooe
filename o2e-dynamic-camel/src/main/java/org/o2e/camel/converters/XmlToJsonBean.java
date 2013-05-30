package org.o2e.camel.converters;

import org.apache.camel.Handler;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 4/26/11
 * Time: 10:23 AM
 * To change this template use File | Settings | File Templates.
 */
public class XmlToJsonBean {

    @Handler
    public JSONObject convert(String message) throws JSONException {
//        Message in = exchange.getIn();
        return XML.toJSONObject(message);
    }

}
