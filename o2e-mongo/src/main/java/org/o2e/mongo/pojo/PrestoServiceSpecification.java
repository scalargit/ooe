package org.o2e.mongo.pojo;

import org.hibernate.validator.constraints.NotBlank;
import org.o2e.mongo.annotations.MappedByDataType;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/24/11
 * Time: 1:09 PM
 * To change this template use File | Settings | File Templates.
 */
@Document
@MappedByDataType("presto")
public class PrestoServiceSpecification extends ServiceSpecification {

    private static final long serialVersionUID = 3663384588420249571L;

    @NotBlank
    String prestoHostname;

    @NotNull
    @Min(1)
    @Max(65535)
    int prestoPort;

    String prestoUsername;

    String prestoPassword;

    @NotBlank
    String prestoSid;

    @NotBlank
    String prestoOid;

    @NotBlank
    String version;

    @NotBlank
    String svcVersion;

    Map<String, Object> paramMap = new ConcurrentHashMap<String, Object>();

    List paramList = new ArrayList();

    Map<String, String> httpHeaders = new ConcurrentHashMap<String, String>();

    boolean isSecure = false;

    boolean assertUser = false;

    public PrestoServiceSpecification() {
        super();
    }

    public PrestoServiceSpecification(String name, int refreshIntervalSeconds, String prestoHostname, int prestoPort,
                                      String prestoSid, String prestoOid, String version, String svcVersion,
                                      Map<String, Object> paramMap, List paramList, Map<String, String> httpHeaders,
                                      boolean isSecure) {
        super(name, "presto", refreshIntervalSeconds);
        this.prestoHostname = prestoHostname;
        this.prestoPort = prestoPort;
        this.prestoSid = prestoSid;
        this.prestoOid = prestoOid;
        this.version = version;
        this.svcVersion = svcVersion;
        this.paramMap = paramMap;
        this.paramList = paramList;
        this.httpHeaders = httpHeaders;
        this.isSecure = isSecure;
    }

    public PrestoServiceSpecification(String name, int refreshIntervalSeconds, String prestoHostname, int prestoPort,
                                      String prestoUsername, String prestoPassword, String prestoSid, String prestoOid,
                                      String version, String svcVersion, Map<String, Object> paramMap, List paramList,
                                      Map<String, String> httpHeaders, boolean isSecure) {
        super(name, "presto", refreshIntervalSeconds);
        this.prestoHostname = prestoHostname;
        this.prestoPort = prestoPort;
        this.prestoUsername = prestoUsername;
        this.prestoPassword = prestoPassword;
        this.prestoSid = prestoSid;
        this.prestoOid = prestoOid;
        this.version = version;
        this.svcVersion = svcVersion;
        this.paramMap = paramMap;
        this.paramList = paramList;
        this.httpHeaders = httpHeaders;
        this.isSecure = isSecure;
    }

    public String getPrestoSid() {
        return prestoSid;
    }

    public void setPrestoSid(String prestoSid) {
        this.prestoSid = prestoSid;
    }

    public String getPrestoOid() {
        return prestoOid;
    }

    public void setPrestoOid(String prestoOid) {
        this.prestoOid = prestoOid;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getSvcVersion() {
        return svcVersion;
    }

    public void setSvcVersion(String svcVersion) {
        this.svcVersion = svcVersion;
    }

    public Map<String, Object> getParamMap() {
        return paramMap;
    }

    public void setParamMap(Map<String, Object> paramMap) {
        this.paramMap = paramMap;
    }

    public List getParamList() {
        return paramList;
    }

    public void setParamList(List<String> paramList) {
        this.paramList = paramList;
    }

    public String getPrestoHostname() {
        return prestoHostname;
    }

    public void setPrestoHostname(String prestoHostname) {
        this.prestoHostname = prestoHostname;
    }

    public int getPrestoPort() {
        return prestoPort;
    }

    public void setPrestoPort(int prestoPort) {
        this.prestoPort = prestoPort;
    }

    public Map<String, String> getHttpHeaders() {
        return httpHeaders;
    }

    public void setHttpHeaders(Map<String, String> httpHeaders) {
        this.httpHeaders = httpHeaders;
    }

    public boolean isSecure() {
        return isSecure;
    }

    public void setSecure(boolean secure) {
        isSecure = secure;
    }

    public boolean isAssertUser() {
        return assertUser;
    }

    public void setAssertUser(boolean assertUser) {
        this.assertUser = assertUser;
    }

    public String getPrestoUsername() {
        return prestoUsername;
    }

    public void setPrestoUsername(String prestoUsername) {
        this.prestoUsername = prestoUsername;
    }

    public String getPrestoPassword() {
        return prestoPassword;
    }

    public void setPrestoPassword(String prestoPassword) {
        this.prestoPassword = prestoPassword;
    }
}
