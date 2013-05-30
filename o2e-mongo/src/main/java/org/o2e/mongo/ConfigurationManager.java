package org.o2e.mongo;

import org.o2e.mongo.pojo.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 6/21/12
 * Time: 9:45 AM
 * To change this template use File | Settings | File Templates.
 */
@Service
public class ConfigurationManager {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    @Autowired
    ConfigurationRepository configurationRepository;

    public void saveProperty(String documentName, String key, Object value) {
        log.debug("Saving property '" + key + "' with value '" + value + "' to document '" + documentName + "'");
        Configuration configuration = configurationRepository.findOne(documentName);
        if (configuration == null) {
            configuration = new Configuration();
            configuration.setName(documentName);
            Map<String, Object> properties = new ConcurrentHashMap<String, Object>();
            properties.put(key, value);
            configuration.setProperties(properties);
        }
        else configuration.getProperties().put(key, value);
        configurationRepository.save(configuration);
    }

    public Object getProperty(String documentName, String key) {
        log.debug("Getting property '" + key + "' from document '" + documentName + "'");
        Configuration configuration = configurationRepository.findOne(documentName);
        if (configuration != null) {
            Map<String, Object> properties = configuration.getProperties();
            if (properties != null) return properties.get(key);
        }
        return null;
    }

}
