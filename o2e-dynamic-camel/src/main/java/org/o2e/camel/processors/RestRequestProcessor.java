package org.o2e.camel.processors;

import org.apache.camel.Exchange;
import org.apache.commons.httpclient.methods.StringRequestEntity;
import org.apache.http.HttpHeaders;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.message.BasicNameValuePair;
import org.o2e.camel.builders.AbstractOoeRouteBuilder;
import org.o2e.mongo.annotations.MappedByDataType;
import org.o2e.mongo.pojo.RestServiceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 5/17/13
 * Time: 2:56 PM
 * To change this template use File | Settings | File Templates.
 */
@MappedByDataType("rest")
public class RestRequestProcessor extends AbstractOoeRequestProcessor {

	final Logger log = LoggerFactory.getLogger(this.getClass());

	public void process(Exchange exchange) throws Exception {
		RestServiceSpecification restService = (RestServiceSpecification) exchange.getProperty(
				AbstractOoeRouteBuilder.SERVICE_SPECIFICATION_PROPERTY);
		if (restService != null) {
			if (HttpPost.METHOD_NAME.equalsIgnoreCase(restService.getMethod())) {
				log.debug("Constructing HTTP POST entity for REST request...");
				if (restService.getStringEntity() != null && !restService.getStringEntity().trim().isEmpty()) {
					String header = ContentType.APPLICATION_FORM_URLENCODED.toString();
					if (restService.getHttpHeaders() != null &&
							restService.getHttpHeaders().get(HttpHeaders.CONTENT_TYPE) != null) {
						header = restService.getHttpHeaders().get(HttpHeaders.CONTENT_TYPE);
					}
					exchange.getOut().setBody(new StringRequestEntity(restService.getStringEntity(), header, null));
				} else if (restService.getRequestParameters() != null && restService.getRequestParameters().size() > 0) {
					List<NameValuePair> nameValuePairs = new ArrayList<NameValuePair>();
					for (Map.Entry<String, Object> entry : restService.getRequestParameters().entrySet()) {
						nameValuePairs.add(new BasicNameValuePair(entry.getKey(), (String) entry.getValue()));
					}
					exchange.getOut().setBody(new UrlEncodedFormEntity(nameValuePairs));
				}
			}
		}
	}
}
