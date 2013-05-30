package org.o2e.cometd.service;

import org.apache.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents a response from a service.
 * 
 * @author aaronsmith
 */
public class ServiceResponse {
	/**
	 * 
	 */
	protected String serviceId;

    /**
     *
     */
    protected Object data;
    /**
     *
     */
    protected String message;
    /**
     *
     */
    protected int statusCode = HttpStatus.SC_OK;
    /**
     *
     */
    protected Map<String, String> ext;

	/**
	 * 
	 */
	public ServiceResponse() {}

    public ServiceResponse(String serviceId) {
        this.serviceId = serviceId;
    }

    public ServiceResponse(String serviceId, Map<String, String> ext) {
        this.serviceId = serviceId;
        this.ext = ext;
    }

    /**
     *
     * @param serviceId
     * @param data
     * @param message
     * @param statusCode
     * @param ext
     */
    public ServiceResponse(String serviceId, Object data, String message, int statusCode, Map<String, String> ext) {
        this.serviceId = serviceId;
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;
        this.ext = ext;
    }

    /**
	 * 

	/**
	 * @return the serviceId
	 */
	public String getServiceId() {
		return serviceId;
	}
	/**
	 * @param serviceId the serviceId to set
	 */
	public void setServiceId(String serviceId) {
		this.serviceId = serviceId;
	}

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, String> getExt() {
        return ext;
    }

    public void setExt(Map<String, String> ext) {
        this.ext = ext;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    /**
	 * 
	 * @return Returns the response contents as a Map
	 */
	public Map<String, Object> asMap() {
		Map<String, Object> response = new HashMap<String, Object>();
		if (serviceId != null) response.put("serviceId", serviceId);
		if (data != null) response.put("data", data);
		if (message != null) response.put("message", message);
        if (statusCode > 0) response.put("statusCode", statusCode);
		if (ext != null) response.put("ext", ext);
		return response;
	}
}
