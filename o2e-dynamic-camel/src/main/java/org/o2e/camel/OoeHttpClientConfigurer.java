package org.o2e.camel;

import org.apache.camel.component.http4.HttpClientConfigurer;
import org.apache.commons.httpclient.protocol.Protocol;
import org.apache.commons.httpclient.protocol.SSLProtocolSocketFactory;
import org.apache.http.client.HttpClient;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.conn.ssl.X509HostnameVerifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/24/11
 * Time: 3:07 PM
 * To change this template use File | Settings | File Templates.
 */
@Named
@Singleton
public class OoeHttpClientConfigurer implements HttpClientConfigurer, org.apache.camel.component.http.HttpClientConfigurer {

    Logger log = LoggerFactory.getLogger(this.getClass());

    @Inject
    protected X509HostnameVerifier x509HostnameVerifier;

    public void configureHttpClient(HttpClient httpClient) {
        try {
            javax.net.ssl.SSLSocketFactory javaxSslSocketFactory = (javax.net.ssl.SSLSocketFactory)
                    javax.net.ssl.SSLSocketFactory.getDefault();
            SSLSocketFactory sslSocketFactory = new SSLSocketFactory(javaxSslSocketFactory, x509HostnameVerifier);

            httpClient.getConnectionManager().getSchemeRegistry().register(
                    new Scheme("https", 443, sslSocketFactory));
        } catch (Exception e) {
            log.error("Error configuring keystore/truststore", e);
        }
    }

    public void configureHttpClient(org.apache.commons.httpclient.HttpClient httpClient) {
        try {
            Protocol authhttps = new Protocol("https", new SSLProtocolSocketFactory(), 443);
            Protocol.registerProtocol("https", authhttps);
        } catch (Exception e) {
            log.error("Error configuring keystore/truststore", e);
        }

    }

}
