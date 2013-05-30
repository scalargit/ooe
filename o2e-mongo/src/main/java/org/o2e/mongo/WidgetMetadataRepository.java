package org.o2e.mongo;

import org.o2e.mongo.pojo.WidgetMetadata;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/26/11
 * Time: 2:26 PM
 * To change this template use File | Settings | File Templates.
 */
public interface WidgetMetadataRepository extends PagingAndSortingRepository<WidgetMetadata, String> {

    public Page<WidgetMetadata> findByName(String name, Pageable pageable);
    public List<WidgetMetadata> findByName(String name);

}
