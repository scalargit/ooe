package org.o2e.mongo.pojo;

import com.mongodb.util.JSON;
import org.apache.commons.beanutils.BeanMap;
import org.hibernate.validator.constraints.NotBlank;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/26/11
 * Time: 2:08 PM
 * To change this template use File | Settings | File Templates.
 */
@Document
public class WidgetMetadata extends BaseDocument {

    private static final long serialVersionUID = 8803013626599554309L;

    @Id
    protected String id;

    @NotBlank
    @Indexed(unique = true)
    protected String name;

    protected String description;

    @NotBlank
    protected String type;

    protected List actions;

    @NotBlank
    protected String category;

    protected String tags;

    @NotBlank
    protected String creator;

    @NotNull
    protected Long createdTime;

    @NotBlank
    protected String lastUpdatedBy;

    @NotNull
    protected Long lastUpdatedTime;

    protected boolean append;

    @NotBlank
    protected String recordBreak;

    @NotNull
    protected Long refreshIntervalSeconds = (long) 60;

    @NotBlank
    protected String clientConnector;

    protected String connectionType;

    @NotBlank
    protected String connectorAction;

    protected Map<String, Object> viz;

    @NotNull
    protected List request;

    @NotNull
    protected List<WidgetMetadataResponse> response;

    protected Map<String, Object> ext;

    public WidgetMetadata() { }

    public WidgetMetadata(String name, String description, String type, List actions, String category, String tags,
                          String creator, Long createdTime, String lastUpdatedBy, Long lastUpdatedTime, boolean append, 
                          String recordBreak, Long refreshIntervalSeconds, String clientConnector,
                          String connectionType, String connectorAction, Map<String, Object> viz, List request,
                          List<WidgetMetadataResponse> response, Map<String, Object> ext) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.actions = actions;
        this.category = category;
        this.tags = tags;
        this.creator = creator;
        this.createdTime = createdTime;
        this.lastUpdatedBy = lastUpdatedBy;
        this.lastUpdatedTime = lastUpdatedTime;
        this.append = append;
        this.recordBreak = recordBreak;
        this.refreshIntervalSeconds = refreshIntervalSeconds;
        this.clientConnector = clientConnector;
        this.connectionType = connectionType;
        this.connectorAction = connectorAction;
        this.viz = viz;
        this.request = request;
        this.response = response;
        this.ext = ext;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public List getActions() {
        return actions;
    }

    public void setActions(List actions) {
        this.actions = actions;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getCreator() {
        return creator;
    }

    public void setCreator(String creator) {
        this.creator = creator;
    }

    public Long getCreatedTime() {
        return createdTime;
    }

    public void setCreatedTime(Long createdTime) {
        this.createdTime = createdTime;
    }

    public String getLastUpdatedBy() {
        return lastUpdatedBy;
    }

    public void setLastUpdatedBy(String lastUpdatedBy) {
        this.lastUpdatedBy = lastUpdatedBy;
    }

    public Long getLastUpdatedTime() {
        return lastUpdatedTime;
    }

    public void setLastUpdatedTime(Long lastUpdatedTime) {
        this.lastUpdatedTime = lastUpdatedTime;
    }

    public boolean isAppend() {
        return append;
    }

    public void setAppend(boolean append) {
        this.append = append;
    }

    public String getRecordBreak() {
        return recordBreak;
    }

    public void setRecordBreak(String recordBreak) {
        this.recordBreak = recordBreak;
    }

    public Long getRefreshIntervalSeconds() {
        return refreshIntervalSeconds;
    }

    public void setRefreshIntervalSeconds(Long refreshIntervalSeconds) {
        this.refreshIntervalSeconds = refreshIntervalSeconds;
    }

    public String getClientConnector() {
        return clientConnector;
    }

    public void setClientConnector(String clientConnector) {
        this.clientConnector = clientConnector;
    }

    public String getConnectorAction() {
        return connectorAction;
    }

    public void setConnectorAction(String connectorAction) {
        this.connectorAction = connectorAction;
    }

    public Map<String, Object> getViz() {
        return viz;
    }

    public void setViz(Map<String, Object> viz) {
        this.viz = viz;
    }

    public List getRequest() {
        return request;
    }

    public void setRequest(List request) {
        this.request = request;
    }

    public List<WidgetMetadataResponse> getResponse() {
        return response;
    }

    public void setResponse(List<WidgetMetadataResponse> response) {
        this.response = response;
    }

    public Map<String, Object> getExt() {
        return ext;
    }

    public void setExt(Map<String, Object> ext) {
        this.ext = ext;
    }

    public String getConnectionType() {
        return connectionType;
    }

    public void setConnectionType(String connectionType) {
        this.connectionType = connectionType;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof WidgetMetadata)) return false;

        WidgetMetadata that = (WidgetMetadata) o;

        if (append != that.append) return false;
        if (actions != null ? !actions.equals(that.actions) : that.actions != null) return false;
        if (category != null ? !category.equals(that.category) : that.category != null) return false;
        if (clientConnector != null ? !clientConnector.equals(that.clientConnector) : that.clientConnector != null)
            return false;
        if (connectionType != null ? !connectionType.equals(that.connectionType) : that.connectionType != null)
            return false;
        if (connectorAction != null ? !connectorAction.equals(that.connectorAction) : that.connectorAction != null)
            return false;
        if (createdTime != null ? !createdTime.equals(that.createdTime) : that.createdTime != null) return false;
        if (creator != null ? !creator.equals(that.creator) : that.creator != null) return false;
        if (description != null ? !description.equals(that.description) : that.description != null) return false;
        if (ext != null ? !ext.equals(that.ext) : that.ext != null) return false;
        if (id != null ? !id.equals(that.id) : that.id != null) return false;
        if (lastUpdatedBy != null ? !lastUpdatedBy.equals(that.lastUpdatedBy) : that.lastUpdatedBy != null)
            return false;
        if (lastUpdatedTime != null ? !lastUpdatedTime.equals(that.lastUpdatedTime) : that.lastUpdatedTime != null)
            return false;
        if (name != null ? !name.equals(that.name) : that.name != null) return false;
        if (recordBreak != null ? !recordBreak.equals(that.recordBreak) : that.recordBreak != null) return false;
        if (refreshIntervalSeconds != null ? !refreshIntervalSeconds.equals(that.refreshIntervalSeconds) : that.refreshIntervalSeconds != null)
            return false;
        if (request != null ? !request.equals(that.request) : that.request != null) return false;
        if (response != null ? !response.equals(that.response) : that.response != null) return false;
        if (tags != null ? !tags.equals(that.tags) : that.tags != null) return false;
        if (type != null ? !type.equals(that.type) : that.type != null) return false;
        if (viz != null ? !viz.equals(that.viz) : that.viz != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (description != null ? description.hashCode() : 0);
        result = 31 * result + (type != null ? type.hashCode() : 0);
        result = 31 * result + (actions != null ? actions.hashCode() : 0);
        result = 31 * result + (category != null ? category.hashCode() : 0);
        result = 31 * result + (tags != null ? tags.hashCode() : 0);
        result = 31 * result + (creator != null ? creator.hashCode() : 0);
        result = 31 * result + (createdTime != null ? createdTime.hashCode() : 0);
        result = 31 * result + (lastUpdatedBy != null ? lastUpdatedBy.hashCode() : 0);
        result = 31 * result + (lastUpdatedTime != null ? lastUpdatedTime.hashCode() : 0);
        result = 31 * result + (append ? 1 : 0);
        result = 31 * result + (recordBreak != null ? recordBreak.hashCode() : 0);
        result = 31 * result + (refreshIntervalSeconds != null ? refreshIntervalSeconds.hashCode() : 0);
        result = 31 * result + (clientConnector != null ? clientConnector.hashCode() : 0);
        result = 31 * result + (connectionType != null ? connectionType.hashCode() : 0);
        result = 31 * result + (connectorAction != null ? connectorAction.hashCode() : 0);
        result = 31 * result + (viz != null ? viz.hashCode() : 0);
        result = 31 * result + (request != null ? request.hashCode() : 0);
        result = 31 * result + (response != null ? response.hashCode() : 0);
        result = 31 * result + (ext != null ? ext.hashCode() : 0);
        return result;
    }
}
