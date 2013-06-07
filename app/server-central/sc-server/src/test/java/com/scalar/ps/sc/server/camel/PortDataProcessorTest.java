package com.scalar.ps.sc.server.camel;

import org.apache.commons.io.IOUtils;
import org.eclipse.jetty.util.ajax.JSON;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 6/7/13
 * Time: 5:15 PM
 * To change this template use File | Settings | File Templates.
 */
public class PortDataProcessorTest {

	final Logger log = LoggerFactory.getLogger(this.getClass());

	@Test
	public void test() throws IOException {
		String json = IOUtils.toString(getClass().getClassLoader().getResourceAsStream("sample-port-data.json"), "UTF-8");
		Object o = JSON.getDefault().fromJSON(json);
		if (o instanceof Object[]) {
			Object[] data = (Object[]) o;
			for (Object datum : data) {
				if (datum instanceof HashMap) {
					HashMap<String, Object> datumMap = (HashMap<String, Object>) datum;
					String target = null;
					for (Map.Entry<String, Object> entry : datumMap.entrySet()) {
						String key = entry.getKey();
						if ("target".equalsIgnoreCase(key)) target = (String) entry.getValue();
						else if ("datapoints".equalsIgnoreCase(key)) {
							Object[] datapoints = (Object[]) entry.getValue();
							for (Object datapoint : datapoints) {
								if (datapoint instanceof Object[]) {
									Object[] datapointArray = (Object[]) datapoint;
									if (datapointArray.length == 2) {
										Double value = (Double) datapointArray[0];
										Long timestamp = (Long) datapointArray[1];
										log.info(value + "; "  + timestamp);
									}
									else log.warn("Expected datapoints array of size 2.");
								}
							}
						}
					}
				}
			}
		}
	}

}
