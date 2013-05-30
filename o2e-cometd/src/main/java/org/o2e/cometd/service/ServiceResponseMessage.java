package org.o2e.cometd.service;

import org.apache.http.HttpStatus;
import org.cometd.server.ServerMessageImpl;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 7/12/11
 * Time: 9:34 AM
 * To change this template use File | Settings | File Templates.
 */
public class ServiceResponseMessage extends ServerMessageImpl {

    private static final long serialVersionUID = 951356551459515955L;

    /**
     * Status message. May be left empty for success, but should include cause for reporting errors.
     */
    protected String message;

    /**
     * Status code for request. Borrows from standard HTTP error codes.
     */
    protected int statusCode = HttpStatus.SC_OK;

    public void setMessage(String message) {
        this.message = message;
        put("message", message);
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
        put("statusCode", statusCode);
    }
}
