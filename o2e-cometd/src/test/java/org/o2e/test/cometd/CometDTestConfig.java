package org.o2e.test.cometd;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 2/9/12
 * Time: 11:28 AM
 * To change this template use File | Settings | File Templates.
 */
public class CometDTestConfig {

    //    protected String cometdUrl = "http://o2e.jackbe.com:8080/o2e-server/cometd";
    //    protected String cometdUrl = "https://o2e.jackbe.com:8443/o2e-server/cometd";
    //    protected String cometdUrl = "http://localhost:9091/o2e-server/cometd";
//    protected String cometdUrl = "https://localhost:8443/o2e-server/cometd";

    protected String cometdUrl;
    protected String username;
    protected String userPassword;
    protected String keyManagerPassword;
    protected long timeoutMillis = 5000;
    protected boolean useBasicAuth;
    protected boolean useFormLogin;

    public String getCometdUrl() {
        return cometdUrl;
    }

    public void setCometdUrl(String cometdUrl) {
        this.cometdUrl = cometdUrl;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUserPassword() {
        return userPassword;
    }

    public void setUserPassword(String userPassword) {
        this.userPassword = userPassword;
    }

    public String getKeyManagerPassword() {
        return keyManagerPassword;
    }

    public void setKeyManagerPassword(String keyManagerPassword) {
        this.keyManagerPassword = keyManagerPassword;
    }

    public long getTimeoutMillis() {
        return timeoutMillis;
    }

    public void setTimeoutMillis(long timeoutMillis) {
        this.timeoutMillis = timeoutMillis;
    }

    public boolean isUseBasicAuth() {
        return useBasicAuth;
    }

    public void setUseBasicAuth(boolean useBasicAuth) {
        this.useBasicAuth = useBasicAuth;
    }

    public boolean isUseFormLogin() {
        return useFormLogin;
    }

    public void setUseFormLogin(boolean useFormLogin) {
        this.useFormLogin = useFormLogin;
    }
}
