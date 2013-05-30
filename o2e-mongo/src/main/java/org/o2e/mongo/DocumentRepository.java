package org.o2e.mongo;

import org.o2e.mongo.pojo.GenericDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.PagingAndSortingRepository;

import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 8/19/11
 * Time: 3:50 PM
 * To change this template use File | Settings | File Templates.
 */
public interface DocumentRepository extends PagingAndSortingRepository<GenericDocument, String> {

    public Page<GenericDocument> findByName(String name, Pageable pageable);
    public List<GenericDocument> findByName(String name);

}
