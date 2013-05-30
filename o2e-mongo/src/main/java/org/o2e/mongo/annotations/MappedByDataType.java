package org.o2e.mongo.annotations;

import java.lang.annotation.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 3/29/12
 * Time: 1:56 PM
 * To change this template use File | Settings | File Templates.
 */
@Documented
@Inherited
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface MappedByDataType {

    /**
     * @return the String data type to map to this class
     */
    String value();

}
