package org.o2e.mongo;

import org.o2e.mongo.pojo.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 6/21/12
 * Time: 10:07 AM
 * To change this template use File | Settings | File Templates.
 */
public interface ConfigurationRepository extends PagingAndSortingRepository<Configuration, String> {

}
