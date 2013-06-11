package org.o2e.camel;

import org.apache.camel.component.http4.HttpClientConfigurer;
import org.apache.commons.httpclient.protocol.Protocol;
import org.apache.commons.httpclient.protocol.SSLProtocolSocketFactory;
import org.apache.http.client.HttpClient;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.conn.ssl.X509HostnameVerifier;
import org.o2e.util.KeyStoreUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.IOException;
import java.net.Socket;
import java.net.UnknownHostException;
import java.security.*;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

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

    @Inject
    protected KeyStoreUtil keyStoreUtil;

    public void configureHttpClient(HttpClient httpClient) {
        try {
            javax.net.ssl.SSLSocketFactory javaxSslSocketFactory = (javax.net.ssl.SSLSocketFactory)
                    javax.net.ssl.SSLSocketFactory.getDefault();
            SSLSocketFactory sslSocketFactory = new TrustAllSSLSocketFactory(keyStoreUtil.getKeyStore());

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

    class TrustAllSSLSocketFactory extends SSLSocketFactory {
        SSLContext sslContext = SSLContext.getInstance("TLS");

        public TrustAllSSLSocketFactory(KeyStore truststore) throws NoSuchAlgorithmException, KeyManagementException,
                KeyStoreException, UnrecoverableKeyException {
            super(truststore);

            TrustManager tm = new X509TrustManager() {
                public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                }

                public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
                }

                public X509Certificate[] getAcceptedIssuers() {
                    return null;
                }
            };

            sslContext.init(null, new TrustManager[] { tm }, null);
        }

        @Override
        public Socket createSocket(Socket socket, String host, int port, boolean autoClose) throws IOException,
                UnknownHostException {
            return sslContext.getSocketFactory().createSocket(socket, host, port, autoClose);
        }

        @Override
        public Socket createSocket() throws IOException {
            return sslContext.getSocketFactory().createSocket();
        }
    }
}
