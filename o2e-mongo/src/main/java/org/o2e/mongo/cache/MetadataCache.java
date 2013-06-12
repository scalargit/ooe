package org.o2e.mongo.cache;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import org.o2e.mongo.ServiceRepository;
import org.o2e.mongo.WidgetMetadataRepository;
import org.o2e.mongo.pojo.ServiceSpecification;
import org.o2e.mongo.pojo.WidgetMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 12/26/12
 * Time: 2:17 PM
 * To change this template use File | Settings | File Templates.
 */
@Service
public class MetadataCache {

	final Logger log = LoggerFactory.getLogger(this.getClass());

	@Autowired
	WidgetMetadataRepository widgetMetadataRepository;

	@Autowired
	ServiceRepository serviceRepository;

	LoadingCache<String, WidgetMetadata> widgetMetadataCache;
	LoadingCache<String, ServiceSpecification> serviceSpecificationCache;

	@Value("${org.o2e.server.mongodb.metadata.cache.ttl.seconds}")
	protected long ttlSeconds;

	@Value("${org.o2e.server.mongodb.metadata.cache.size}")
	protected long cacheSize;

	@PostConstruct
	public void init() {
		widgetMetadataCache = CacheBuilder.newBuilder().
				maximumSize(cacheSize).
				expireAfterWrite(ttlSeconds, TimeUnit.SECONDS).
				build(new CacheLoader<String, WidgetMetadata>() {
					@Override
					public WidgetMetadata load(String widgetMetadataId) throws Exception {
						return widgetMetadataRepository.findOne(widgetMetadataId);
					}
				});
		serviceSpecificationCache = CacheBuilder.newBuilder().
				maximumSize(cacheSize).
				expireAfterWrite(ttlSeconds, TimeUnit.SECONDS).
				build(new CacheLoader<String, ServiceSpecification>() {
					@Override
					public ServiceSpecification load(String serviceSpecificationId) throws Exception {
						return serviceRepository.findOne(serviceSpecificationId);
					}
				});
	}

	public WidgetMetadata getWidgetMetadata(String widgetMetadataId) {
		try {
			return widgetMetadataCache.get(widgetMetadataId);
		} catch (Exception e) {
			log.warn("Error loading WidgetMetadata with id '" + widgetMetadataId + "'", e);
			return null;
		}
	}

	public ServiceSpecification getServiceSpecification(String serviceSpecificationId) {
		try {
			return serviceSpecificationCache.get(serviceSpecificationId);
		} catch (Exception e) {
			log.warn("Error loading ServiceSpecification with id '" + serviceSpecificationId + "'", e);
			return null;
		}
	}

}
