package com.scalar.ps.sc.server.sensor;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.util.JSON;
import org.apache.commons.io.IOUtils;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 6/7/13
 * Time: 5:15 PM
 * To change this template use File | Settings | File Templates.
 */
public class SensorDataProcessorTest {

	final Logger log = LoggerFactory.getLogger(this.getClass());

	final SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm:ss");
	final SensorDataResponseProcessor sensorDataProcessor = new SensorDataResponseProcessor();

	@Test
	public void testProcess() throws IOException {
		String json = IOUtils.toString(getClass().getClassLoader().getResourceAsStream("sample-port-data.json"), "UTF-8");
		BasicDBObject allData = sensorDataProcessor.process(json);
		log.info("Done.");
	}

	@Test
	public void testReduceString() {
		String target = "system.bb.port1.hash1.port.20000.bytes";
		String reduced = sensorDataProcessor.reduceTargetString(target);
	}

}
