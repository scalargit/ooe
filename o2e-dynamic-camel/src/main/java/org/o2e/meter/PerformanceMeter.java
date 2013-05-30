package org.o2e.meter;

import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.jmx.export.annotation.ManagedOperation;
import org.springframework.jmx.export.annotation.ManagedOperationParameter;
import org.springframework.jmx.export.annotation.ManagedOperationParameters;
import org.springframework.jmx.export.annotation.ManagedResource;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/29/12
 * Time: 12:22 PM
 * To change this template use File | Settings | File Templates.
 */
@Service
@ManagedResource
public class PerformanceMeter {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    public static final String METRICS_COLLECTION = "metrics";
    public static final String METRIC_KEY = "metric";
    public static final String HASHCODE_KEY = "hashcode";
    public static final String LATENCY_KEY = "latency";
    public static final String RUN_ID_KEY = "runId";
    public static final String DATA_GET_LATENCY_METRIC = "dataGetLatency";

    @Autowired
    MongoOperations mongoOperations;

    @Value("${org.o2e.meter.performanceMeter.mapSize}")
    int mapSize = 10000;

    @Value("${org.o2e.meter.performanceMeter.mongoWriteEnabled}")
    boolean mongoWriteEnabled = false;

    @Value("${org.o2e.meter.performanceMeter.enabled}")
    boolean enabled = false;

    // Set initial runId to the startup time of the webapp so that it's at least unique across restarts without using JMX
    protected String runId = "" + new Date().getTime();

    protected ConcurrentHashMap<Integer, Set<String>> dataAvailableMap = new ConcurrentHashMap<Integer, Set<String>>();

    protected ConcurrentHashMap<Integer, Long> times = new ConcurrentHashMap<Integer, Long>();

    public void registerListeners(Integer hashcode, Set<String> listeners) {
        if (enabled) {
            if (dataAvailableMap.size() > mapSize) dataAvailableMap.clear();
            Object ret = dataAvailableMap.putIfAbsent(hashcode, listeners);
            if (ret == null) {
                // New data
                if (times.size() > mapSize) times.clear();
                times.put(hashcode, new Date().getTime());
            }
        }
    }

    public void acknowledge(Integer hashcode, String sessionId) {
        if (enabled) {
            Set<String> listeners = dataAvailableMap.get(hashcode);
            if (listeners != null) {
                listeners.remove(sessionId);
                Long start = times.get(hashcode);
                long end = new Date().getTime();
                long diff = start != null ? end - start : -1;
                log.debug(hashcode + ";" + diff);
                if (listeners.isEmpty()) {
                    dataAvailableMap.remove(hashcode);
                }
                if (mongoWriteEnabled) writeMetric(hashcode, diff);
            }
        }
    }

    private void writeMetric(int hashcode, long diff) {
        DBObject dbObject = new BasicDBObject();
        dbObject.put(RUN_ID_KEY, runId);
        dbObject.put(METRIC_KEY, DATA_GET_LATENCY_METRIC);
        dbObject.put(HASHCODE_KEY, hashcode);
        dbObject.put(LATENCY_KEY, diff);
        mongoOperations.getCollection(METRIC_KEY).save(dbObject);
    }

    @ManagedOperation
    public void resetMaps() {
        dataAvailableMap.clear();
        times.clear();
    }

    @ManagedOperation
    @ManagedOperationParameters({
            @ManagedOperationParameter(name = "runId", description = "Changes global run ID. Used to distinguish between " +
                    "tests in the metrics collection.")})
    public void changeRun(String runId) {
        this.runId = runId;
    }

}
