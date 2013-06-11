package org.o2e.mongo.pojo;

import org.hibernate.validator.constraints.NotBlank;
import org.o2e.mongo.annotations.MappedByDataType;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 5/17/13
 * Time: 11:15 AM
 * To change this template use File | Settings | File Templates.
 */
@Document
@MappedByDataType("rest")
public class RestServiceSpecification extends ServiceSpecification {

    private static final long serialVersionUID = -3221535933109121151L;

    @NotBlank
    String url;

    @NotBlank
    String method;

    String stringEntity;

    Map<String, String> httpHeaders = new ConcurrentHashMap<String, String>();

    public RestServiceSpecification() {
        super();
    }

    public RestServiceSpecification(String name, String dataType, int refreshIntervalSeconds, String url,
                                    String method, Map<String, String> httpHeaders) {
        super(name, dataType, refreshIntervalSeconds);
        this.url = url;
        this.method = method;
        this.httpHeaders = httpHeaders;
    }

    public RestServiceSpecification(String name, String dataType, int refreshIntervalSeconds, String url,
                                    String method, String stringEntity, Map<String, String> httpHeaders) {
        super(name, dataType, refreshIntervalSeconds);
        this.url = url;
        this.method = method;
        this.stringEntity = stringEntity;
        this.httpHeaders = httpHeaders;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getStringEntity() {
        return stringEntity;
    }

    public void setStringEntity(String stringEntity) {
        this.stringEntity = stringEntity;
    }

    public Map<String, String> getHttpHeaders() {
        return httpHeaders;
    }

    public void setHttpHeaders(Map<String, String> httpHeaders) {
        this.httpHeaders = httpHeaders;
    }
}
