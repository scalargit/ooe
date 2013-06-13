package com.scalar.ps.sc.server.sensor;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import org.apache.camel.Exchange;
import org.apache.camel.Message;
import org.eclipse.jetty.server.Response;
import org.eclipse.jetty.util.ajax.JSON;
import org.o2e.camel.processors.AbstractOoeResponseProcessor;
import org.o2e.mongo.annotations.MappedByDataType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 6/7/13
 * Time: 5:12 PM
 * To change this template use File | Settings | File Templates.
 */
@MappedByDataType("sensor")
public class SensorDataResponseProcessor extends AbstractOoeResponseProcessor {

	final Logger log = LoggerFactory.getLogger(this.getClass());

	final SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm:ss");

	public void process(Exchange exchange) throws Exception {
		Message in = exchange.getIn();
		String body = in.getBody(String.class);
		BasicDBObject allData = process(body);
		if (allData.size() > 0) in.setBody(allData);
		else {
			log.warn("Could not parse message body into JSON: '" + body + "'");
			in.setBody(body);
		}
	}

	public BasicDBObject process(String body) {
		List<Map> allData = new ArrayList<>();
		if (body != null && body.length() > 0) {
			Object o = JSON.getDefault().fromJSON(body);
			Map<Long, Map> flow = new HashMap<>();
			if (o instanceof Object[]) {
				Object[] data = (Object[]) o;
				for (Object datum : data) {
					if (datum instanceof HashMap) {
						HashMap<String, Object> datumMap = (HashMap<String, Object>) datum;
						String target = (String) datumMap.get("target");
						target = reduceTargetString(target);
						Object[] datapoints = (Object[]) datumMap.get("datapoints");
						for (Object datapoint : datapoints) {
							if (datapoint instanceof Object[]) {
								Object[] datapointArray = (Object[]) datapoint;
								if (datapointArray.length == 2) {
									Double value = (Double) datapointArray[0];
									Long timestamp = (Long) datapointArray[1];
									Map<String, Double> values = flow.get(timestamp);
									if (values == null) {
										values = new HashMap<>();
										flow.put(timestamp, values);
									}
									values.put(target, value);
								}
								else log.warn("Expected datapoints array of size 2.");
							}
						}
					}
				}
			}

			for (Map.Entry<Long, Map> entry : flow.entrySet()) {
				Long timestamp = entry.getKey();
				Map<String, Double> values = entry.getValue();
				Map data = new HashMap();
				data.put("time", dateFormat.format(new Date(timestamp * 1000)));
				for (Map.Entry<String, Double> valuesEntry : values.entrySet()) {
					String target = valuesEntry.getKey();
					Double value = valuesEntry.getValue();
					data.put(target, value);
				}
				allData.add(data);
			}

		}
		BasicDBList list = new BasicDBList();
		list.addAll(allData);

        BasicDBObject dataWrapper = new BasicDBObject();
        dataWrapper.append("data", list);

        BasicDBObject resp = new BasicDBObject();
        resp.append("response", dataWrapper);
		return resp;
	}

	public String reduceTargetString(String in) {
		if (in != null) {
			String[] split = in.split("\\.");
			if (split.length >= 2) {
				String target = split[split.length - 2];
				log.trace(target);
				return target;
			}
		}
		return null;
	}

}
