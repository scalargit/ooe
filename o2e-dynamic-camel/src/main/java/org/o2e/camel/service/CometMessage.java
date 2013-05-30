package org.o2e.camel.service;

import java.io.Serializable;

/**
 * Created with IntelliJ IDEA.
 * User: Jeff
 * Date: 12/13/12
 * Time: 12:41 PM
 * To change this template use File | Settings | File Templates.
 */
public class CometMessage implements Serializable {

    private static final long serialVersionUID = -7600287192806958388L;

    String sessionId;

    int payloadHash;

    public CometMessage() {
    }

    public CometMessage(CometMessage cometMessage) {
        this(cometMessage.getSessionId(), cometMessage.getPayloadHash());
    }

    public CometMessage(String sessionId, int payloadHash) {
        this.sessionId = sessionId;
        this.payloadHash = payloadHash;
    }

    public int getPayloadHash() {
        return payloadHash;
    }

    public String getSessionId() {
        return sessionId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CometMessage)) return false;

        CometMessage that = (CometMessage) o;

        if (payloadHash != that.payloadHash) return false;
        if (!sessionId.equals(that.sessionId)) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = sessionId.hashCode();
        result = 31 * result + payloadHash;
        return result;
    }

    @Override
    public String toString() {
        return "CometMessage{" +
                "sessionId='" + sessionId + '\'' +
                ", payloadHash=" + payloadHash +
                '}';
    }
}
