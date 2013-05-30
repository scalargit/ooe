package org.o2e.mongo.pojo;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;
import org.o2e.mongo.annotations.MappedByDataType;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/15/11
 * Time: 1:35 PM
 * To change this template use File | Settings | File Templates.
 */
@Document
@MappedByDataType("rss")
public class RssServiceSpecification extends ServiceSpecification {

    private static final long serialVersionUID = 2616462874904204523L;

//    public static final String URI_REQUEST_PARAM = "uri";

    @NotBlank
    @URL
    protected String uri;

    protected boolean splitEntries;

    public RssServiceSpecification() {
        super();
    }

    public RssServiceSpecification(String name, int refreshIntervalSeconds, String uri, boolean splitEntries) {
        super(name, "rss", refreshIntervalSeconds);
        this.uri = uri;
        this.splitEntries = splitEntries;
    }

    public String getUri() {
        return uri;
    }

    public void setUri(String uri) {
        this.uri = uri;
    }

    public boolean isSplitEntries() {
        return splitEntries;
    }

    public void setSplitEntries(boolean splitEntries) {
        this.splitEntries = splitEntries;
    }

}
