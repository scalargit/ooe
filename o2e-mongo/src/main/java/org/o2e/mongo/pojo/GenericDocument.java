package org.o2e.mongo.pojo;

import org.hibernate.validator.constraints.NotBlank;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 8/19/11
 * Time: 3:12 PM
 * To change this template use File | Settings | File Templates.
 */
@Document
public class GenericDocument extends BaseDocument implements Serializable {

    private static final long serialVersionUID = 5704858837896096092L;

    @Id
    protected String id;

    @Indexed
    @NotBlank
    protected String name;

    protected Set<String> tags = new HashSet<String>();

    @NotNull
    protected Map<String, Object> json = new HashMap<String, Object>();

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

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }

    public Map<String, Object> getJson() {
        return json;
    }

    public void setJson(Map<String, Object> json) {
        this.json = json;
    }

}
