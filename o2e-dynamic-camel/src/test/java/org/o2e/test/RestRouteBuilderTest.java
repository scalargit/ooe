package org.o2e.test;

import org.apache.camel.component.http4.HttpMethods;
import org.apache.http.client.methods.HttpGet;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.camel.builders.BuilderUtil;
import org.o2e.camel.builders.RestRouteBuilder;
import org.o2e.mongo.pojo.RestServiceSpecification;
import org.o2e.test.cometd.DynamicRouteTestHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 6/17/13
 * Time: 2:08 PM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-cometd-test.xml")
public class RestRouteBuilderTest {

	final Logger log = LoggerFactory.getLogger(this.getClass());

	@Inject
	DynamicRouteTestHelper dynamicRouteTestHelper;

	@Test
	public void testUriBuilder() {
		Map<String, Object> params = new HashMap<>();
		List<String> targets = new ArrayList<>();
		targets.add("system.bb.port1.hash1.port.all.bytes");
		targets.add("system.bb.port1.hash1.port.119.bytes");
		targets.add("system.bb.port1.hash1.port.20000.bytes");
		targets.add("system.bb.port1.hash1.port.7788.bytes");
		params.put("target", targets);
		params.put("from", "-1minutes");
		params.put("until", "now");
		params.put("targets", "all%2C119%2C20000");
		String url = "https://198.186.190.22/render";
		RestServiceSpecification restServiceSpecification = new RestServiceSpecification("name", "sensor", 60, url,
				HttpGet.METHOD_NAME, null);
		restServiceSpecification.setRequestParameters(params);
		String uri = BuilderUtil.toUrl(restServiceSpecification);
		log.info(uri);
	}

}
