package org.o2e.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.Enumeration;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/5/11
 * Time: 11:41 AM
 * To change this template use File | Settings | File Templates.
 */
@Component
public class KeyStoreUtil {

    Logger log = LoggerFactory.getLogger(this.getClass());

    public static String KEYSTORE_FILE_PROPERTY = "javax.net.ssl.keyStore";
    public static String KEYSTORE_PASSWORD_PROPERTY = "javax.net.ssl.keyStorePassword";
    public static String KEY_PASSWORD_PROPERTY = "org.eclipse.jetty.ssl.keypassword";
    public static String KEY_ALIAS_PROPERTY = "org.o2e.keystore.key.alias";

    String systemDn;

    KeyStore keyStore;

    public String getSystemDn()  {
        return systemDn;
    }

    @PostConstruct
    public void readSystemDn() throws IOException, KeyStoreException, NoSuchAlgorithmException,
            CertificateException, UnrecoverableEntryException {

        log.info("Attempting to obtain the DN of the key configured for this application...");
        String keyPassword = System.getProperty(KEY_PASSWORD_PROPERTY);
        String keyAlias = System.getProperty(KEY_ALIAS_PROPERTY);

        if (keyPassword == null) throw new IllegalArgumentException("Java System property '" +
                KEY_PASSWORD_PROPERTY + "' must not be null");
        if (keyAlias == null) throw new IllegalArgumentException("Java System property '" +
                KEY_ALIAS_PROPERTY + "' must not be null");

        KeyStore.PasswordProtection keyPasswordProtectionParameter = new KeyStore.PasswordProtection(
                keyPassword.trim().toCharArray());
        KeyStore.PrivateKeyEntry pkEntry = (KeyStore.PrivateKeyEntry) getKeyStore().getEntry(
                keyAlias, keyPasswordProtectionParameter);
        if (pkEntry.getCertificate() instanceof X509Certificate) {
            X509Certificate x509Certificate = (X509Certificate) pkEntry.getCertificate();
            systemDn = x509Certificate.getSubjectDN().getName();
            log.info("Read the following DN: '" + systemDn + "'");
        }

    }

    public X509Certificate retrieveIssuerCert(X509Certificate userCert)
            throws Exception {
        X509Certificate issuer = null;
        for (Enumeration<String> e = getKeyStore().aliases(); e.hasMoreElements() && issuer == null; ) {
            String alias = e.nextElement();
            java.security.cert.Certificate[] chain = getKeyStore().getCertificateChain(alias);
            if (chain != null) {
                for (int cert = 0; ((cert < chain.length) && (issuer == null)); cert++) {
                    if (((X509Certificate) chain[cert]).getSubjectDN().getName().equals(userCert.getIssuerDN().getName())) {
                        log.trace("Found matching Issuer Cert for cert with DN '" + userCert.getSubjectDN() + "'");
                        issuer = (X509Certificate) chain[cert];
                    }
                }
            } else {
                X509Certificate cert = (X509Certificate) getKeyStore().getCertificate(alias);
                if (cert.getSubjectDN().getName().equals(userCert.getIssuerDN().getName())) {
                    log.trace("Found matching Issuer Cert for cert with DN '" + userCert.getSubjectDN() + "'");
                    issuer = cert;
                }
            }
        }
        if (log.isTraceEnabled() && issuer == null)
            log.trace("Could not find matching issuer for cert with DN '" + userCert.getSubjectDN() + "' and issuer '" +
                    userCert.getIssuerDN() + "'");
        return issuer;
    }

    public KeyStore getKeyStore() throws IOException, NoSuchAlgorithmException, KeyStoreException, CertificateException {
        if (keyStore == null) loadKeyStore();
        return keyStore;
    }

    private void loadKeyStore() throws KeyStoreException, IOException, NoSuchAlgorithmException, CertificateException {
        String keyStoreFile = System.getProperty(KEYSTORE_FILE_PROPERTY);
        String keyStorePassword = System.getProperty(KEYSTORE_PASSWORD_PROPERTY);

        if (keyStoreFile == null) throw new IllegalArgumentException("Java System property '" +
                KEYSTORE_FILE_PROPERTY + "' must not be null");
        if (keyStorePassword == null) throw new IllegalArgumentException("Java System property '" +
                KEYSTORE_PASSWORD_PROPERTY + "' must not be null");

        char[] keyStorePasswordCharArray = keyStorePassword.trim().toCharArray();
        FileInputStream inputStream = null;
        try {
            keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
            inputStream = new FileInputStream(keyStoreFile);
            keyStore.load(inputStream, keyStorePasswordCharArray);
        } finally {
            if (inputStream != null) {
                inputStream.close();
            }
        }
    }

}
