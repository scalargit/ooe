package org.o2e.mongo.pojo;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/12/11
 * Time: 4:26 PM
 * Services which require passwords to obtain data but do not wish to store passwords in Mongo should implement this
 * interface. Passwords should be provided at invocation time instead.
 */
public interface PasswordProtectedService {

    public void setPassword(String password);

}
