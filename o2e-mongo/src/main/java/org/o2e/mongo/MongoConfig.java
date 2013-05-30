package org.o2e.mongo;

import com.mongodb.Mongo;
import com.mongodb.MongoOptions;
import com.mongodb.ServerAddress;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.net.SocketFactory;
import javax.net.ssl.SSLSocketFactory;
import java.net.UnknownHostException;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/22/12
 * Time: 7:50 PM
 * To change this template use File | Settings | File Templates.
 */
@Configuration
public class MongoConfig {

    Logger log = LoggerFactory.getLogger(this.getClass());

    @Value("${org.o2e.server.mongodb.port}")
    int mongoPort;

    @Value("${org.o2e.server.mongodb.host}")
    String mongoHost;

    @Value("${org.o2e.server.mongodb.useSsl}")
    boolean useSsl = false;

    @Autowired
    private MongoOptions mongoOptions;

    public @Bean Mongo mongo() throws UnknownHostException {
        return new Mongo(new ServerAddress(mongoHost, mongoPort), mongoOptions);
    }

    public @Bean SocketFactory mongoSocketFactory() {
        if (useSsl) return SSLSocketFactory.getDefault();
        else return SocketFactory.getDefault();
    }

}
