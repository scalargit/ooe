package org.o2e.test.cometd;

import org.cometd.client.BayeuxClient;
import org.cometd.client.transport.LongPollingTransport;
import org.eclipse.jetty.client.ContentExchange;
import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.client.security.Realm;
import org.eclipse.jetty.client.security.SimpleRealmResolver;
import org.eclipse.jetty.http.HttpFields;
import org.eclipse.jetty.util.ssl.SslContextFactory;
import org.junit.Before;
import org.o2e.util.KeyStoreUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.assertTrue;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 8/22/11
 * Time: 10:40 AM
 * To change this template use File | Settings | File Templates.
 */
public abstract class CometdBaseTest {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    final protected EchoListener listener = new EchoListener();
    protected boolean handshaken = false;
    protected boolean useMockUsername = true;
    public BayeuxClient client;

    @Inject
    protected KeyStoreUtil keyStoreUtil;

    public abstract CometDTestConfig getConfig();

    @Before
    public void handshake() throws Exception {
        HttpClient httpClient = buildHttpClient();
        httpClient.start();
        Map<String, Object> options = new HashMap<String, Object>();
        client = new BayeuxClient(getConfig().getCometdUrl(), new LongPollingTransport(options, httpClient));

        if (getConfig().isUseFormLogin()) {
            String jSessionId = formLogin(httpClient);
            client.setCookie("JSESSIONID", jSessionId);
        }

        if (useMockUsername) {
            Map<String, Object> handshakeFields = new HashMap<String, Object>();
            handshakeFields.put("username", getConfig().getUsername());
            handshakeFields.put("password", getConfig().getUserPassword());
            client.handshake(handshakeFields);
        } else client.handshake();
        log.debug("Initiating handshake to '" + getConfig().getCometdUrl() + "'");
        handshaken = client.waitFor(getConfig().getTimeoutMillis(), BayeuxClient.State.CONNECTED);
        assertTrue("Not handshaken to cometd server.", handshaken);
        log.debug("Handshake complete.");
    }

    private String formLogin(HttpClient httpClient) throws IOException, InterruptedException {
        String url = getConfig().getCometdUrl().substring(0, getConfig().getCometdUrl().indexOf("/cometd"));
        url += "/j_spring_security_check";
        String message = "j_username=" + getConfig().getUsername() + "&j_password=" + getConfig().getUserPassword();

        ContentExchange exchange = new ContentExchange(true);
        exchange.setMethod("POST");
        exchange.setURL(url);
        exchange.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        exchange.setRequestContentSource(new ByteArrayInputStream(message.getBytes("UTF-8")));

        httpClient.send(exchange);
        exchange.waitForDone();
        HttpFields responseFields = exchange.getResponseFields();
        String setCookie = responseFields.getStringField("Set-Cookie");
        String cookie = setCookie != null ? setCookie.substring(0, setCookie.indexOf(";")) : null;
        String jSessionId = cookie != null ? cookie.substring(cookie.indexOf("=") + 1) : null;
        log.info("JSESSIONID: " + jSessionId);
        return jSessionId;
    }

    private HttpClient buildHttpClient() throws IOException, NoSuchAlgorithmException, KeyStoreException,
            CertificateException {
        HttpClient httpClient = null;
        if (getConfig().getCometdUrl().contains("https")) {
            SslContextFactory sslContextFactory = new SslContextFactory();
            sslContextFactory.setKeyStore(keyStoreUtil.getKeyStore());
            sslContextFactory.setTrustStore(keyStoreUtil.getKeyStore());
            sslContextFactory.setKeyManagerPassword(getConfig().getKeyManagerPassword());
            httpClient = new HttpClient(sslContextFactory);
        } else httpClient = new HttpClient();

        if (getConfig().isUseBasicAuth()) {
            httpClient.setRealmResolver(new SimpleRealmResolver(new Realm() {
                public String getId() {
                    return "realm";
                }

                public String getPrincipal() {
                    return getConfig().getUsername();
                }

                public String getCredentials() {
                    return getConfig().getUserPassword();
                }
            }));
        }

        return httpClient;
    }

    public BayeuxClient getClient() {
        return client;
    }

    public void setClient(BayeuxClient client) {
        this.client = client;
    }

    public void setKeyStoreUtil(KeyStoreUtil keyStoreUtil) {
        this.keyStoreUtil = keyStoreUtil;
    }

    public boolean isHandshaken() {
        return handshaken;
    }

    public void setHandshaken(boolean handshaken) {
        this.handshaken = handshaken;
    }

    public EchoListener getListener() {
        return listener;
    }
}
