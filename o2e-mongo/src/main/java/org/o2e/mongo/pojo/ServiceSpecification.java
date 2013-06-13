package org.o2e.mongo.pojo;

import org.hibernate.validator.constraints.NotBlank;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/7/11
 * Time: 12:53 PM
 * To change this template use File | Settings | File Templates.
 */
@Document
public class ServiceSpecification extends BaseDocument {

    private static final long serialVersionUID = -1752524454026606249L;

    @Id
    protected String id;

    @NotBlank
    protected String name;

    @NotBlank
    protected String dataType;

    @NotNull
    @Min(1)
    protected long refreshIntervalSeconds;

    protected Map<String, Object> requestParameters;

    boolean shared = true;

    public ServiceSpecification() {
        requestParameters = new HashMap<String, Object>();
    }

    public ServiceSpecification(String name, String dataType, int refreshIntervalSeconds) {
        super();
        this.name = name;
        this.dataType = dataType;
        this.refreshIntervalSeconds = refreshIntervalSeconds;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public long getRefreshIntervalSeconds() {
        return refreshIntervalSeconds;
    }

    public void setRefreshIntervalSeconds(long refreshIntervalSeconds) {
        this.refreshIntervalSeconds = refreshIntervalSeconds;
    }

    public Map<String, Object> getRequestParameters() {
        return requestParameters;
    }

    public void setRequestParameters(Map<String, Object> requestParameters) {
        this.requestParameters = requestParameters;
    }

    public boolean isShared() {
        return shared;
    }

    public void setShared(boolean shared) {
        this.shared = shared;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ServiceSpecification)) return false;

        ServiceSpecification that = (ServiceSpecification) o;

        if (refreshIntervalSeconds != that.refreshIntervalSeconds) return false;
        if (!dataType.equals(that.dataType)) return false;
        if (id != null ? !id.equals(that.id) : that.id != null) return false;
        if (!name.equals(that.name)) return false;
        if (!requestParameters.equals(that.requestParameters)) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + name.hashCode();
        result = 31 * result + dataType.hashCode();
        result = 31 * result + (int) (refreshIntervalSeconds ^ (refreshIntervalSeconds >>> 32));
        result = 31 * result + requestParameters.hashCode();
        return result;
    }
}
