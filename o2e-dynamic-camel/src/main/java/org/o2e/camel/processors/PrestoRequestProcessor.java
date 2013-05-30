package org.o2e.camel.processors;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.apache.commons.httpclient.methods.StringRequestEntity;
import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.message.BasicNameValuePair;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.o2e.camel.builders.AbstractOoeRouteBuilder;
import org.o2e.mongo.pojo.PrestoServiceSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.UnsupportedEncodingException;
import java.util.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/24/11
 * Time: 2:22 PM
 * To change this template use File | Settings | File Templates.
 */
public class PrestoRequestProcessor implements Processor {

    Logger log = LoggerFactory.getLogger(this.getClass());

    public void process(Exchange exchange) throws Exception {
        log.debug("Constructing HTTP POST entity for Presto request...");
        PrestoServiceSpecification prestoService = (PrestoServiceSpecification) exchange.getProperty(
                AbstractOoeRouteBuilder.SERVICE_SPECIFICATION_PROPERTY);
        if (prestoService != null) {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("sid", prestoService.getPrestoSid());
            jsonObject.put("oid", prestoService.getPrestoOid());
            jsonObject.put("version", prestoService.getVersion());
            jsonObject.put("svcVersion", prestoService.getSvcVersion());
            if (prestoService.getParamList() != null && !prestoService.getParamList().isEmpty()) {
                jsonObject.put("params", prestoService.getParamList());
            } else if (prestoService.getParamMap() != null && !prestoService.getParamMap().isEmpty()) {
                Map<String, Object> paramMap = prestoService.getParamMap();
                fixArrays(paramMap);
                jsonObject.put("params", getJSONObject(paramMap));
            } else {
                jsonObject.put("params", new ArrayList<String>());
            }

//            setBodyForHttpClient3x(exchange, jsonObject.toString());
            setBodyForHttpClient4x(exchange, jsonObject.toString());
        }
    }

    private void setBodyForHttpClient3x(Exchange exchange, String inputStream) throws UnsupportedEncodingException {
        exchange.getOut().setBody(new StringRequestEntity("inputStream=" + inputStream,
                "application/x-www-form-urlencoded", null));
    }

    private void setBodyForHttpClient4x(Exchange exchange, String inputStream) throws UnsupportedEncodingException {
        List<NameValuePair> nameValuePairs = new ArrayList<NameValuePair>();
        nameValuePairs.add(new BasicNameValuePair("inputStream", inputStream));
        exchange.getOut().setBody(new UrlEncodedFormEntity(nameValuePairs));
    }

    private void fixArrays(Map map) {
        List keysToRemove = new ArrayList();
        Map entriesToAdd = new HashMap();
        for (Object o : map.entrySet()) {
            Map.Entry entry = (Map.Entry) o;
            if (entry.getValue() instanceof Object[]) {
                Object[] array = (Object[]) entry.getValue();
                List list = new ArrayList();
                Collections.addAll(list, array);
                keysToRemove.add(entry.getKey());
                entriesToAdd.put(entry.getKey(), list);
                for (Object listObject : list) {
                    if (listObject instanceof Map) fixArrays((Map) listObject);
                }
            } else if (entry.getValue() instanceof List) {
                for (Object listObject : ((List) entry.getValue())) {
                    if (listObject instanceof Map) fixArrays((Map) listObject);
                }
            } else if (entry.getValue() instanceof Map) {
                fixArrays((Map) entry.getValue());
            }
        }

        for (Object key : keysToRemove) {
            map.remove(key);
        }

        map.putAll(entriesToAdd);
    }

    // Recursively converts a Map/nested Map object to a valid (castable) JSONObject.
    private JSONObject getJSONObject(Map map) {
        for (Object o : map.entrySet()) {
            Map.Entry entry = (Map.Entry) o;
            Object value = entry.getValue();
            if (value instanceof Map) {
                entry.setValue(getJSONObject((Map) value));
            } else if (value instanceof List) {
                JSONArray tmpArray = new JSONArray();
                for (Object listMember : (List) value) {
                    if (listMember instanceof Map) {
                        tmpArray.put(getJSONObject((Map) listMember));
                    } else {
                        tmpArray.put(listMember);
                    }
                }
                entry.setValue(tmpArray);
            }
        }

        return new JSONObject(map);
    }

}
