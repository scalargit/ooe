package org.o2e.mongo;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.mongo.pojo.PrestoServiceSpecification;
import org.o2e.mongo.pojo.RssServiceSpecification;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.inject.Inject;
import javax.validation.ConstraintViolation;
import javax.validation.Validation;
import javax.validation.Validator;
import javax.validation.ValidatorFactory;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/7/11
 * Time: 2:40 PM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-mongo-test.xml")
public class MongoServiceTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    Validator validator;

    @Inject
    ServiceRepository serviceRepository;

    @Inject
    MongoTemplate mongoTemplate;

    @Before
    public void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    public void crudTest() {
        RssServiceSpecification rssService = constructRssService();
        PrestoServiceSpecification prestoService = constructPrestoService();
        validateServiceSpecification(rssService);
        validateServiceSpecification(prestoService);

        log.info("Saving ServiceSpecifications...");
        rssService = (RssServiceSpecification) serviceRepository.save(rssService);
        prestoService = (PrestoServiceSpecification) serviceRepository.save(prestoService);

        log.info("Finding ServiceSpecifications...");
        RssServiceSpecification foundRss = (RssServiceSpecification) serviceRepository.findOne(rssService.getId());
        PrestoServiceSpecification foundPresto = (PrestoServiceSpecification) serviceRepository.findOne(prestoService.getId());

        assertEquals(rssService, foundRss);
        assertEquals(prestoService, foundPresto);

        log.info("Deleting ServiceSpecifications...");
        serviceRepository.delete(rssService.getId());
        serviceRepository.delete(prestoService.getId());

        log.info("Finding ServiceSpecifications...");
        foundRss = (RssServiceSpecification) serviceRepository.findOne(rssService.getId());
        foundPresto = (PrestoServiceSpecification) serviceRepository.findOne(prestoService.getId());

        assertNull(foundRss);
        assertNull(foundPresto);
    }

//    @Test
//    public void insertJumService() {
//        String uri = "https://jum.solers.com:8443/msg/services";
//        String deliveryEndpoint = "https://my.endpoint.com/foo";
//        JumServiceSpecification jumService = new JumServiceSpecification("jumService", "jum", true, 0, uri, deliveryEndpoint, "sw", 1000 * 60 * 5);
//        jumService.setId("4e89f929c949b73834591915");
//        serviceRepository.save(jumService);
////        return (JumServiceSpecification) serviceRepository.save(jumService);
//    }

    //    @Test
    public void listAllServices() {
        ArrayList<ServiceSpecification> serviceSpecifications = (ArrayList<ServiceSpecification>) serviceRepository.findAll();
        log.info("Found '" + serviceSpecifications.size() + "' serviceSpecification(s).");
        for (ServiceSpecification s : serviceSpecifications) {
            String asString = mongoTemplate.getConverter().convertToMongoType(s).toString();
            log.info(asString);
        }
    }

    //    @Test
    public void deleteAllServices() {
        log.info("Deleting all services in Mongo repository.");
        serviceRepository.deleteAll();
    }

    private PrestoServiceSpecification constructPrestoService() {
        String prestoHostname = "sw.jackbe.com";
        int prestoPort = 443;
        return new PrestoServiceSpecification("ListPrestoServices", 30,
                prestoHostname, prestoPort, "ListPrestoServices", "invoke", "1.1", "0.1", null,
                new ArrayList<String>(), new HashMap<String, String>(), true);
    }

    private RssServiceSpecification constructRssService() {
        String uri = "http://weather.yahooapis.com/forecastrss?w=2502265";
        return new RssServiceSpecification("Yahoo Weather Sunnyvale", 60, uri, false);
    }


    private void validateServiceSpecification(ServiceSpecification serviceSpecification) {
        Set<ConstraintViolation<ServiceSpecification>> constraints = validator.validate(serviceSpecification);
        log.debug("Found " + constraints.size() + " violations.");
        for (ConstraintViolation<ServiceSpecification> violation : constraints) {
            log.info(violation.getMessage());
        }
        assertEquals("Must have no constraint violations.", 0, constraints.size());
    }

}
