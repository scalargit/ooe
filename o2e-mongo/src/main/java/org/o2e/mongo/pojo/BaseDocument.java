package org.o2e.mongo.pojo;

import com.mongodb.util.JSON;
import org.apache.commons.beanutils.BeanMap;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 6/22/12
 * Time: 11:48 AM
 * To change this template use File | Settings | File Templates.
 */
public abstract class BaseDocument implements Serializable {

    private static final long serialVersionUID = 8969117360275265574L;

    public Map asMap() {
        Map map = new HashMap(new BeanMap(this));
        map.remove("class");
        return map;
    }

    @Override
    public String toString() {
        return JSON.serialize(asMap());
    }

}
