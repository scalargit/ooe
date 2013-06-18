package org.o2e.camel.builders;

import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIBuilder;
import org.o2e.mongo.pojo.RestServiceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URL;
import java.util.List;
import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 6/17/13
 * Time: 2:55 PM
 * To change this template use File | Settings | File Templates.
 */
public class BuilderUtil {

	final static Logger log = LoggerFactory.getLogger(BuilderUtil.class.getClass());

	public static String toUrl(RestServiceSpecification restServiceSpecification) {
		String url = restServiceSpecification.getUrl();
		String scheme = url.contains("https") ? "https" : "http";

		// Add any request parameters to the URL query string
		if (HttpGet.METHOD_NAME.equalsIgnoreCase(restServiceSpecification.getMethod())) {
			URIBuilder builder = new URIBuilder();
			try {
				URL theUrl = new URL(url);
				builder.
						setScheme(theUrl.getProtocol()).
						setHost(theUrl.getHost()).
						setPort(theUrl.getPort()).
						setPath(theUrl.getPath());
				for (Map.Entry<String, Object> entry : restServiceSpecification.getRequestParameters().entrySet()) {
					Object val = entry.getValue();
					if (val instanceof String) {
						builder.addParameter(entry.getKey(), (String) val);
					} else if (val instanceof List) {
						List list = (List) entry.getValue();
						for (Object o : list) {
							if (o instanceof String) {
								builder.addParameter(entry.getKey(), (String) o);
							} else throw new IllegalArgumentException("Cannot support value of type " + o.getClass());
						}
					} else throw new IllegalArgumentException("Cannot support value of type " + val.getClass());
				}
				if ("https".equalsIgnoreCase(scheme)) {
					builder.addParameter("httpClientConfigurer", "ooeHttpClientConfigurer");
				}

				if ("https".equalsIgnoreCase(scheme)) url = url.replace("https", "https4");
				else url = url.replace("http", "http4");
				url = builder.build().toString();

			} catch (Exception e) {
				log.warn("Error constructing URL.", e);
			}
		}


		return url;
	}

//	private static String appendParameter(String url, String key, String value) {
//		url += url.contains("?") ? "&" : "?";
//		url += key + "=" + value;
//		return url;
//	}

}
