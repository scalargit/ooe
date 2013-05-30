package org.o2e.mongo;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.mongo.pojo.GenericDocument;
import org.o2e.mongo.pojo.WidgetMetadata;
import org.o2e.mongo.pojo.WidgetMetadataResponse;
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
import java.util.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/26/11
 * Time: 3:34 PM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-mongo-test.xml")
public class MongoWidgetMetadataTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    Validator validator;

    @Inject
    WidgetMetadataRepository widgetMetadataRepository;

    @Inject
    MongoTemplate mongoTemplate;

    @Before
    public void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    
//    @Test
    public void saveWidgetMetadata() {
        log.info("Entering saveWidgetMetadata test");

        WidgetMetadata goodWidgetMetadata = constructWidgetMetadata();
        Set<ConstraintViolation<WidgetMetadata>> constraints = validator.validate(goodWidgetMetadata);
        Assert.assertTrue("WidgetMetadata should have validated properly.", constraints.isEmpty());
        WidgetMetadata saved = widgetMetadataRepository.save(goodWidgetMetadata);
        String asString = mongoTemplate.getConverter().convertToMongoType(saved).toString();
        log.info(asString);
    }

//    @Test
    public void listWidgetMetadata() {
        log.info("Entering listWidgetMetadata test");
        Collection<WidgetMetadata> documents = (Collection<WidgetMetadata>) widgetMetadataRepository.findAll();
        log.info("Found '" + documents.size() + "' widget metadata instance(s).");
        for (WidgetMetadata widgetMetadata : documents) {
            log.info(widgetMetadata.toString());
        }
    }

//    @Test
    public void getWidgetMetadata() {
        log.info("Entering getWidgetMetadata test");
        String widgetMetadataId = "4eae9e72ad106b08300789bc";
        WidgetMetadata widgetMetadata = widgetMetadataRepository.findOne(widgetMetadataId);
        if (widgetMetadata != null) log.info("Found WidgetMetadata: '" + widgetMetadata + "'");
        else log.info("Did not find WidgetMetadata with id '" + widgetMetadataId);
    }

//    @Test
    public void deleteAllWidgetMetadata() {
        log.info("Deleting all widget metadata in Mongo repository.");
        widgetMetadataRepository.deleteAll();
    }

    @Test
    public void testToString() {
        log.info("Testing toString...");
        log.info(constructWidgetMetadata().toString());

    }

    private WidgetMetadata constructWidgetMetadata() {
        List<Map<String, String>> request = new ArrayList<Map<String, String>>();
        Map<String, String> request1 = new HashMap<String, String>();
        request1.put("name", "sid");
        request1.put("header", "Service ID");
        request1.put("defaultValue", "SI_Geocoded_Fellows_FY10");
        Map<String, String> request2 = new HashMap<String, String>();
        request2.put("name", "oid");
        request2.put("header", "Operation ID");
        request2.put("defaultValue", "Invoke");
        request.add(request1);
        request.add(request2);

//        WidgetMetadataResponse response1 = new WidgetMetadataResponse("CURNTAFFL", "Affiliation",
//                "title", "defaultAffiliation", null, true);
//        WidgetMetadataResponse response2 = new WidgetMetadataResponse("Lat", "Latitude",
//                "marker_lat", "defaultLat", null, true);
//        WidgetMetadataResponse response3 = new WidgetMetadataResponse("Long", "Longitude",
//                "marker_lng", "defaultLong", null, true);

        Map<String, Object> viz = new HashMap<String, Object>();
        Map<String, String> vizGmap = new HashMap<String, String>();
        vizGmap.put("marker", "images/FF6600.png");
        vizGmap.put("widgetTitle", "Institutions Represented by SI Research Fellows (Map)");
        Map<String, String> vizGrid = new HashMap<String, String>();
        vizGrid.put("widgetTitle", "Institutions Represented by SI Research Fellows (Table)");
        List<String> vizList = new ArrayList<String>();
        vizList.add("listitem1");
        vizList.add("listitem2");
        viz.put("gmap", vizGmap);
        viz.put("grid", vizGrid);
        viz.put("vizList", vizList);
        WidgetMetadata goodWidgetMetadata = new WidgetMetadata();
        goodWidgetMetadata.setName("presto test - " + new Date());
        goodWidgetMetadata.setClientConnector("presto");
        goodWidgetMetadata.setConnectorAction("invoke");
        goodWidgetMetadata.setRecordBreak("DataTable.Entry");
        goodWidgetMetadata.setRequest(request);
//        goodWidgetMetadata.setResponse(Arrays.asList(response1, response2, response3));
        goodWidgetMetadata.setViz(viz);
        goodWidgetMetadata.setRefreshIntervalSeconds((long) 120);
        goodWidgetMetadata.setCategory("aCategory");
        goodWidgetMetadata.setType("aType");
        goodWidgetMetadata.setCreator("aUser");
        goodWidgetMetadata.setCreatedTime(new Date().getTime());
        goodWidgetMetadata.setLastUpdatedBy("aUser");
        goodWidgetMetadata.setLastUpdatedTime(new Date().getTime());
        return goodWidgetMetadata;
    }

}
