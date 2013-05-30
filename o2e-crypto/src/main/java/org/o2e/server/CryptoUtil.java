package org.o2e.server;

import org.apache.commons.io.FileUtils;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.properties.EncryptableProperties;

import java.io.*;
import java.util.Properties;
import java.util.Scanner;
import java.util.Set;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 8/29/11
 * Time: 1:38 PM
 * To change this template use File | Settings | File Templates.
 */
public class CryptoUtil {

    public static final String O2E_SECRETS_FILE_DEFAULT = "etc/secrets.properties";
    public static final String O2E_MONGODB_PASSWORD = "org.o2e.server.mongodb.o2e.password";
    public static final String JETTY_SSL_KEY_PASSWORD = "org.eclipse.jetty.ssl.keypassword";
    public static final String JETTY_SSL_KEYSTORE_PASSWORD = "org.eclipse.jetty.ssl.password";
    public static final String JAVAX_KEYSTORE_PASSWORD = "javax.net.ssl.keyStorePassword";
    public static final String JAVAX_TRUSTSTORE_PASSWORD = "javax.net.ssl.trustStorePassword";

    StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
    Console console = System.console();
    File secretsFile = new File(O2E_SECRETS_FILE_DEFAULT);

    public CryptoUtil() { }

    public CryptoUtil(File secretsFile) {
        setSecretsFile(secretsFile);
    }

    public EncryptableProperties decryptPasswords(String masterPassword, boolean print) throws IOException {
        if (masterPassword == null) {
            if (console != null) masterPassword = readMasterPasswordFromConsole();
            else masterPassword = readMasterPasswordFromScanner();
        }

        EncryptableProperties props = new EncryptableProperties(encryptor);
        if (secretsFile.exists()) {
            encryptor.setPassword(masterPassword);
            props.load(new FileReader(secretsFile));
            Set keys = props.keySet();
            for (Object keyObj : keys) {
                String key = (String) keyObj;
                String val = props.getProperty(key);
                if (print) System.out.println(key + "=" + val);
            }
        }
        else System.out.println("Secrets file at '" + secretsFile.getAbsolutePath() + "' does not exist.");
        return props;
    }

    public void encryptPasswords(String[] args) throws IOException {
        createSecretsFile();
        writeSecretsFile(readSecretsFromArguments(args));
    }

    public void encryptPasswords() throws IOException {
        Properties props = null;
        if (console != null) props = readSecretsFromConsole(console);
        else props = readSecretsFromScanner();
        writeSecretsFile(props);
    }

    private void writeSecretsFile(Properties props) throws IOException {
        System.out.println("Writing passwords to '" + secretsFile.getAbsolutePath() + "'.");
        props.store(new FileWriter(secretsFile.getAbsolutePath()), "Created automatically by O2E Bootstrap Launcher.");
        System.out.println("Done.");
    }

    private void createSecretsFile() throws IOException {
        if (secretsFile.exists()) {
            System.out.println("Backing up existing secrets file...");
            FileUtils.copyFile(secretsFile, new File(secretsFile + ".bak"));
            if (!secretsFile.delete()) {
                System.err.println("Could not delete old secrets file.");
                System.exit(1);
            }
        } else {
            File dir = new File(secretsFile.getParent());
            if (!dir.exists()) {
                System.out.println("Creating directory structure '" + dir.getAbsolutePath() + "'");
                FileUtils.forceMkdir(new File(secretsFile.getParent()));
            }
        }
    }

    private Properties readSecretsFromArguments(String[] args) {
        System.out.println("Reading secrets properties from arguments...");
//        EncryptableProperties props = new EncryptableProperties(encryptor);
        Properties props = new Properties();
        if (args.length == 0) System.out.println("WARNING: No key/value pairs passed in as arguments to encrypt.");
        if (args.length % 2 == 1) throw new IllegalArgumentException("Found argument array of size " +
                args.length + " but expected an even numbered size.");
        String masterPassword = System.getProperty("org.o2e.server.encryption.password");
        encryptor.setPassword(masterPassword);
        for (int i = 0; i < args.length; i+=2) {
            String key = args[i];
            String value = args[i + 1];
            props.setProperty(key, encrypt(value));
        }
        return props;
    }

    private EncryptableProperties readSecretsFromScanner() {
        System.out.println("WARNING: Could not obtain Java Console. Passwords will not be masked!");
        EncryptableProperties props = new EncryptableProperties(encryptor);
        Scanner scanner = new Scanner(System.in);
        System.out.print("Set a new O2E master encryption password: ");
        encryptor.setPassword(scanner.nextLine().trim());

        System.out.print("Set the O2E keystore password: ");
        String keystorePassword = encrypt(scanner.nextLine().trim());
        props.setProperty(JETTY_SSL_KEYSTORE_PASSWORD, keystorePassword);
        props.setProperty(JAVAX_KEYSTORE_PASSWORD, keystorePassword);
        System.out.print("Set the O2E truststore password: ");
        props.setProperty(JAVAX_TRUSTSTORE_PASSWORD, encrypt(scanner.nextLine().trim()));
        System.out.print("Set the O2E key password: ");
        props.setProperty(JETTY_SSL_KEY_PASSWORD, encrypt(scanner.nextLine().trim()));
        System.out.print("Set the O2E Mongo DB password: ");
        props.setProperty(O2E_MONGODB_PASSWORD, encrypt(scanner.nextLine().trim()));

        System.out.print("Would you like to set any additional passwords? (y/[n])");
        String additionalPasswords = scanner.nextLine();
        while (additionalPasswords.toLowerCase().startsWith("y")) {
            System.out.print("Set password property: ");
            String key = scanner.nextLine().trim();
            System.out.print("Set password: ");
            String val = scanner.nextLine().trim();
            props.setProperty(key, encrypt(val));
            System.out.print("Would you like to set any additional passwords? (y/[n])");
            additionalPasswords = scanner.nextLine();
        }
        return props;
    }

    private Properties readSecretsFromConsole(Console console) {
//        EncryptableProperties props = new EncryptableProperties(encryptor);
        Properties props = new Properties();
        encryptor.setPassword(new String(console.readPassword("Set the O2E master encryption password: ")));

        String keystorePassword = new String(console.readPassword("Set the O2E keystore password: "));
        props.setProperty(JETTY_SSL_KEYSTORE_PASSWORD, encrypt(keystorePassword));
        props.setProperty(JAVAX_KEYSTORE_PASSWORD, encrypt(keystorePassword));
        props.setProperty(JAVAX_TRUSTSTORE_PASSWORD, encrypt(new String(console.readPassword("Set the O2E truststore password: "))));
        props.setProperty(JETTY_SSL_KEY_PASSWORD, encrypt(new String(console.readPassword("Set the O2E key password: "))));
        props.setProperty(O2E_MONGODB_PASSWORD, encrypt(new String(console.readPassword("Set the O2E Mongo DB password: "))));

        String additionalPasswords = console.readLine("Would you like to set any additional passwords? (y/[n])");
        while (additionalPasswords.toLowerCase().startsWith("y")) {
            String key = console.readLine("Set password property: ");
            String val = new String(console.readPassword("Set password: "));
            props.setProperty(key, encrypt(val));
            additionalPasswords = console.readLine("Would you like to set any additional passwords? (y/[n])");
        }
        return props;
    }

    private String readMasterPasswordFromScanner() {
        System.out.println("WARNING: Could not obtain Java Console. Passwords will not be masked!");
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter the O2E master encryption password: ");
        return scanner.nextLine().trim();
    }

    private String readMasterPasswordFromConsole() {
        return new String(console.readPassword("Enter the O2E master encryption password: "));
    }

    private String encrypt(String message) {
        return "ENC(" + encryptor.encrypt(message) + ")";
    }

    public void setSecretsFile(File secretsFile) {
        if (secretsFile == null) throw new IllegalArgumentException("Secrets file must not be null.");
        this.secretsFile = secretsFile;
    }

    public File getSecretsFile() {
        return secretsFile;
    }
}
