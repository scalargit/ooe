package org.o2e.camel;

import com.thoughtworks.xstream.XStream;
import org.apache.camel.dataformat.xstream.JsonDataFormat;
import org.apache.camel.spi.ClassResolver;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 4/25/11
 * Time: 4:11 PM
 * To change this template use File | Settings | File Templates.
 */
public class JsonDataFormatExt extends JsonDataFormat {

    @Override
    protected XStream createXStream(ClassResolver resolver) {
        XStream xs = super.createXStream(resolver);
        xs.setMode(XStream.ID_REFERENCES);
        return xs;
    }
    
}
