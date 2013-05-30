package org.o2e;

import org.apache.commons.lang.ArrayUtils;
import org.o2e.server.CryptoMain;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 8/29/11
 * Time: 1:49 PM
 * To change this template use File | Settings | File Templates.
 */
public class CryptoMainTest {

    public static void main(String[] args) throws IOException {
        encryptUseArguments();
//        encryptInteractive();
        decrypt();
    }

    public static void encryptInteractive() throws IOException {
        List<String> args = new ArrayList<String>();
        args.add(CryptoMain.O2E_LAUNCH_OPTION + CryptoMain.O2E_LAUNCH_ENCRYPT);
        args.add(CryptoMain.O2E_ENCRYPT_MODE + CryptoMain.O2E_ENCRYPT_MODE_INTERACTIVE);
        runCryptoMain(args);
    }

    public static void encryptUseArguments() throws IOException {
        System.setProperty("org.o2e.server.encryption.password", "asd");
        List<String> args = new ArrayList<String>();
        args.add(CryptoMain.O2E_LAUNCH_OPTION + CryptoMain.O2E_LAUNCH_ENCRYPT);
        args.add(CryptoMain.O2E_ENCRYPT_MODE + CryptoMain.O2E_ENCRYPT_MODE_USE_ARGUMENTS);
        args.add("foo.bar.someKey");
        args.add("somePass");
        runCryptoMain(args);
    }

    private static void decrypt() throws IOException {
        List<String> args = new ArrayList<String>();
        args.add(CryptoMain.O2E_LAUNCH_OPTION + CryptoMain.O2E_LAUNCH_DECRYPT);
        runCryptoMain(args);
    }

    private static void runCryptoMain(List<String> args) throws IOException {
        System.out.println("Launching CryptoMain with the following options: ");
        System.out.println(ArrayUtils.toString(args));
        CryptoMain cryptoMain = new CryptoMain();
        cryptoMain.parseCommandLine(args.toArray(new String[args.size()]));
    }
}
