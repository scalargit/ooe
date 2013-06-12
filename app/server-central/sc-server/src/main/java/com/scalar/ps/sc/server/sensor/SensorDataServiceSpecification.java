package com.scalar.ps.sc.server.sensor;

import org.o2e.mongo.annotations.MappedByDataType;
import org.o2e.mongo.pojo.RestServiceSpecification;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 6/11/13
 * Time: 3:45 PM
 * To change this template use File | Settings | File Templates.
 */
@Document
@MappedByDataType("sensor")
public class SensorDataServiceSpecification extends RestServiceSpecification {

	private static final long serialVersionUID = -2421535933109121151L;

}
