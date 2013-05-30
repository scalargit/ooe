package org.o2e.server;

import java.io.File;
import java.io.IOException;
import java.util.Properties;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/6/12
 * Time: 11:09 AM
 * To change this template use File | Settings | File Templates.
 */
public abstract class AbstractBootstrap {

    public static final String O2E_SECRETS_FILE = "org.o2e.crypto.secretsFile";
    public static final String O2E_MASTER_PASSWORD = "org.o2e.server.encryption.password";

    CryptoUtil cryptoUtil = new CryptoUtil();

    public abstract void doBootstrap(String[] args) throws Exception;

    public static void usage() {
        System.out.println("Usage: java -jar o2e-bootstrap-{version}.jar [options] ");
        System.out.println("Options:");
        System.out.println("\t\t'start' (launches Webapp Container)");
        System.exit(0);
    }

    public void start(String[] args) {
        try {
            // Look for the master password as a system property
            String masterPassword = System.getProperty(O2E_MASTER_PASSWORD);
            if (masterPassword == null) {
                System.out.println("No master password was found in Java System Property '" + O2E_MASTER_PASSWORD +
                        "', so it must be entered manually.");
            }

            // Look for the secrets file location as a system property
            String secretsLocation = System.getProperty(O2E_SECRETS_FILE);
            if (secretsLocation != null) {
                cryptoUtil.setSecretsFile(new File(secretsLocation));
            }
            if (!cryptoUtil.getSecretsFile().exists()) {
                System.out.println("No secrets file found at '" + cryptoUtil.getSecretsFile().getAbsolutePath() + ".");
                System.out.println("Exiting.");
                System.exit(1);
            }

            Properties props = cryptoUtil.decryptPasswords(masterPassword, false);

            // Export the decrypted properties as Java System Properties
            for (Object o : props.keySet()) {
                String key = (String) o;
                String val = props.getProperty(key);
                System.setProperty(key, val);
            }

            doBootstrap(args);
        } catch (Exception e) {
            System.err.println("Error occurred during O2E Bootstrap startup.");
            e.printStackTrace();
        }
    }

}