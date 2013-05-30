package org.o2e.mongo;

import org.o2e.mongo.pojo.ServiceSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/7/11
 * Time: 2:03 PM
 * To change this template use File | Settings | File Templates.
 */
public interface ServiceRepository extends PagingAndSortingRepository<ServiceSpecification, String> {

    public Page<ServiceSpecification> findByName(String serviceName, Pageable pageable);
    public List<ServiceSpecification> findByName(String serviceName);

    public Page<ServiceSpecification> findByDataType(String serviceName, Pageable pageable);
    public List<ServiceSpecification> findByDataType(String serviceName);

}
