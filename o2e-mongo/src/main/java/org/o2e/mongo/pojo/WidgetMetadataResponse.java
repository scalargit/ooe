package org.o2e.mongo.pojo;

import org.hibernate.validator.constraints.NotBlank;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/26/11
 * Time: 2:08 PM
 * To change this template use File | Settings | File Templates.
 */
public class WidgetMetadataResponse {

    @NotBlank
    protected String name;

    @NotBlank
    protected String header;

//    protected String annotations;
    // TODO: revert annotations back to an ArrayList once Spring Data - MongoDB persists it properly. See https://jira.springsource.org/browse/DATAMONGO-309
    List<String> annotations = new ArrayList<String>();

    protected String defaultValue;

//    protected String actions;
    protected List<String> actions = new ArrayList<String>();

    protected boolean ignore;

    public WidgetMetadataResponse() { }

    public WidgetMetadataResponse(String name, String header, List<String> annotations, String defaultValue,
                                  List<String> actions, boolean ignore) {
        this.name = name;
        this.header = header;
        this.annotations = annotations;
        this.defaultValue = defaultValue;
        this.actions = actions;
        this.ignore = ignore;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHeader() {
        return header;
    }

    public void setHeader(String header) {
        this.header = header;
    }

    public List<String> getAnnotations() {
        return annotations;
    }

    public void setAnnotations(List<String> annotations) {
        this.annotations = annotations;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }

    public List<String> getActions() {
        return actions;
    }

    public void setActions(List<String> actions) {
        this.actions = actions;
    }

    public boolean isIgnore() {
        return ignore;
    }

    public void setIgnore(boolean ignore) {
        this.ignore = ignore;
    }
}
