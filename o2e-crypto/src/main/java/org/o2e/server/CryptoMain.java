package org.o2e.server;

import org.apache.commons.lang.ArrayUtils;
import org.jasypt.exceptions.EncryptionOperationNotPossibleException;

import java.io.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 8/29/11
 * Time: 11:35 AM
 * To change this template use File | Settings | File Templates.
 */
public class CryptoMain {

    public static final String O2E_LAUNCH_OPTION = "org.o2e.launchOption:";
    public static final String O2E_LAUNCH_ENCRYPT = "encrypt";
    public static final String O2E_LAUNCH_DECRYPT = "decrypt";

    public static final String O2E_ENCRYPT_MODE = "org.o2e.encryptMode:";
    public static final String O2E_ENCRYPT_MODE_INTERACTIVE = "interactive";
    public static final String O2E_ENCRYPT_MODE_USE_ARGUMENTS = "useArguments";

    public static final String O2E_SECRETS_FILE = "org.o2e.secretsFile:";

    CryptoUtil cryptoUtil = new CryptoUtil();

    public static void main(String[] args) throws IOException {
        CryptoMain cryptoMain = new CryptoMain();
        cryptoMain.parseCommandLine(args);
    }

    public static void usage() {
        System.out.println("Usage: java -jar o2e-crypto-{version}.jar [options] ");
        System.out.println("Options:");
        System.out.println(O2E_LAUNCH_OPTION + "<arg>\t\t\t\t\tValid values: '" + O2E_LAUNCH_ENCRYPT + "' (creates " +
                "secrets.properties file) and '" + O2E_LAUNCH_DECRYPT + "' (prints out decrypted properties)");
        System.out.println(O2E_ENCRYPT_MODE + "<arg>\t\t\t\t\tValid values: '" + O2E_ENCRYPT_MODE_INTERACTIVE +
                "' (prompts user for password input on command line) and '" + O2E_ENCRYPT_MODE_USE_ARGUMENTS +
                "' (allows passwords to be passed in as additional arguments in alternating key/value pairs)");
        System.out.println(O2E_SECRETS_FILE + "<arg>\t\t\t\t\tValid values: '" + "<path_to_secrets_file> (Defaults " +
                "to '" + CryptoUtil.O2E_SECRETS_FILE_DEFAULT + "')");
        System.exit(1);
    }

    public void parseCommandLine(String[] args) throws IOException {
        if (args.length == 0) {
            System.out.println("Must supply a valid '" + O2E_LAUNCH_OPTION + "'");
            usage();
        }
        int argsToRemove = 0;
        String launchOption = O2E_ENCRYPT_MODE;
        String encryptMode = O2E_ENCRYPT_MODE_INTERACTIVE;
        String secretsFile = null;
        for (String arg : args) {
            if (arg.startsWith(O2E_LAUNCH_OPTION)) {
                launchOption = arg.substring(O2E_LAUNCH_OPTION.length());
                argsToRemove++;
            }
            if (arg.startsWith(O2E_ENCRYPT_MODE)) {
                encryptMode = arg.substring(O2E_ENCRYPT_MODE.length());
                argsToRemove++;
            }
            if (arg.startsWith(O2E_SECRETS_FILE)) {
                secretsFile = arg.substring(O2E_SECRETS_FILE.length());
                argsToRemove++;
            }
        }
        if (secretsFile != null && secretsFile.trim().length() > 0) cryptoUtil.setSecretsFile(new File(secretsFile));

        if (O2E_LAUNCH_ENCRYPT.equalsIgnoreCase(launchOption)) {
            if (O2E_ENCRYPT_MODE_USE_ARGUMENTS.equals(encryptMode)) {
                // Extract all remaining arguments, which are expected to be an even number
                if (args.length > argsToRemove) {
                    String[] subArray = (String[]) ArrayUtils.subarray(args, argsToRemove, args.length);
                    cryptoUtil.encryptPasswords(subArray);
                }
            } else if (O2E_ENCRYPT_MODE_INTERACTIVE.equals(encryptMode)) {
                cryptoUtil.encryptPasswords();
            } else throw new IllegalArgumentException("Invalid value '" + encryptMode + "' for argument '" +
                    O2E_ENCRYPT_MODE + "'");
        }
        else if (O2E_LAUNCH_DECRYPT.equalsIgnoreCase(launchOption)) {
            try {
                cryptoUtil.decryptPasswords(null, true);
            } catch (EncryptionOperationNotPossibleException e) {
                System.out.println("Unable to decrypt properties. Please double check the master password. " +
                        "Full stack trace: ");
                e.printStackTrace();
            }
        }
        else usage();
    }


}
