package org.o2e.test.cometd;

import org.cometd.bayeux.Message;
import org.cometd.bayeux.client.ClientSessionChannel;
import org.cometd.client.BayeuxClient;
import org.o2e.camel.service.DefaultRouteService;
import org.o2e.cometd.service.DataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 11/20/12
 * Time: 2:05 PM
 * To change this template use File | Settings | File Templates.
 */
public class DataGetListener implements ClientSessionChannel.MessageListener {

    final Logger log = LoggerFactory.getLogger(this.getClass());

    Set<String> hashcodes = new HashSet<String>();
    String getChannel;
    BayeuxClient bayeuxClient;
    int numIgnoredMessages = 0;
    int totalMessages = 0;
    long lastMessageTimestamp = -1;
    List<Double> latencies = new ArrayList<Double>();
    long refreshMillis = 1000 * 60;

    public DataGetListener(BayeuxClient bayeuxClient, String getChannel) {
        this.bayeuxClient = bayeuxClient;
        this.getChannel = getChannel;
    }

    public void onMessage(ClientSessionChannel clientSessionChannel, Message message) {
        log.debug("Received message: " + message.getJSON());
        totalMessages++;
        Map map = message.getDataAsMap();
        Object payloadObj = map.get(DefaultRouteService.PAYLOAD_PARAM);
        String serviceSpecificationId = (String) map.get(DataService.SERVICE_SPECIFICATION_ID_PARAM);
        String widgetMetadataId = (String) map.get(DataService.WIDGET_METADATA_ID_PARAM);
        if (payloadObj != null && payloadObj instanceof Map) {
            Map payload = (Map) payloadObj;
            String hashcode = (String) payload.get(DefaultRouteService.HASHCODE_PARAM);
            if (hashcode != null && !hashcodes.contains(hashcode)) {
                hashcodes.add(hashcode);
                if (payload.get(DefaultRouteService.DATA_AVAILABLE_PARAM) != null) {
                    if (lastMessageTimestamp > 1000) {
                        long now = new Date().getTime();
                        long diff = now - lastMessageTimestamp;
                        log.debug("diff: " + diff + " ms.");
                        if (diff > 60000) {
                            latencies.add(diff - (double) refreshMillis);
                        }
                    }
                    lastMessageTimestamp = new Date().getTime();

                    Map<String, String> request = new HashMap<String, String>();
                    request.put(DataService.SERVICE_SPECIFICATION_ID_PARAM, serviceSpecificationId);
                    request.put(DataService.WIDGET_METADATA_ID_PARAM, widgetMetadataId);
                    log.debug("Publishing request to get data for serviceSpecification with id '" +
                            serviceSpecificationId + "'" + " and widget spec with id '" + widgetMetadataId + "'");
                    bayeuxClient.getChannel(getChannel).publish(request);
                }
            } else numIgnoredMessages++;
        }
    }

    public int getNumIgnoredMessages() {
        return numIgnoredMessages;
    }

    public int getTotalMessages() {
        return totalMessages;
    }

    public List<Double> getLatencies() {
        return latencies;
    }
}
