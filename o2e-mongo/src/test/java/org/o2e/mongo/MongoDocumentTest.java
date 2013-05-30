package org.o2e.mongo;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.mongo.pojo.GenericDocument;
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
 * Date: 8/22/11
 * Time: 10:36 AM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-mongo.xml")
public class MongoDocumentTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    Validator validator;

    @Inject
    DocumentRepository documentRepository;

    @Inject
    MongoTemplate mongoTemplate;

    @Before
    public void setup() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    public void saveDocument() {
        log.info("Entering saveDocument test");
        Map<String, Object> json = new HashMap<String, Object>();
        json.put("attr1", "val1");
        json.put("attr2", "val2");
        json.put("attr3", "val3");

        GenericDocument goodDoc = new GenericDocument();
        goodDoc.setName("my-doc-" + new Date());
        goodDoc.setTags(new HashSet<String>(Arrays.asList("taga", "tagb")));
        goodDoc.setJson(json);
        String asString = mongoTemplate.getConverter().convertToMongoType(goodDoc).toString();
        log.info(asString);

        Set<ConstraintViolation<GenericDocument>> constraints = validator.validate(goodDoc);
        documentRepository.save(goodDoc);
        Assert.assertTrue("GenericDocument should have validated properly.", constraints.isEmpty());

        GenericDocument badDoc = new GenericDocument();
        badDoc.setName(null);
        badDoc.setTags(new HashSet<String>(Arrays.asList("tagc", "tagd")));
        badDoc.setJson(json);
        constraints = validator.validate(badDoc);
        Assert.assertFalse("GenericDocument should failed validation.", constraints.isEmpty());
    }

    @Test
    public void listDocuments() {
        log.info("Entering listDocuments test");
        Collection<GenericDocument> documents = (Collection<GenericDocument>) documentRepository.findAll();
        log.info("Found '" + documents.size() + "' document(s).");
        for (GenericDocument document : documents) {
            log.info(document.toString());
        }
    }

    @Test
    public void deleteAllDocuments() {
        log.info("Deleting all documents in Mongo repository.");
        documentRepository.deleteAll();
    }

}
