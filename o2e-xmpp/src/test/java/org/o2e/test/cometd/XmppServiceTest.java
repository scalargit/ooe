package org.o2e.test.cometd;

import org.cometd.bayeux.Message;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.o2e.cometd.service.XmppService;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import javax.inject.Inject;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/17/11
 * Time: 3:52 PM
 * To change this template use File | Settings | File Templates.
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:o2e-cometd-test.xml")
public class XmppServiceTest extends CometdBaseTest {

    boolean connected = false;

    @Inject
    CometDTestHelper cometDTestHelper;

    @Override
    public CometDTestConfig getConfig() {
        CometDTestConfig config = new CometDTestConfig();
        config.setCometdUrl("http://localhost:8080/exec-server/cometd");
        config.setUsername("jsegal");
        config.setUserPassword("password");
        config.setKeyManagerPassword("password");
        return config;
    }

    public void connect() throws InterruptedException {
        if (handshaken) {
            log.info("Connecting...");

            String serviceChannel = "/service/xmpp/connect";
            BlockingListener listener = new BlockingListener();
            client.getChannel(serviceChannel).subscribe(listener);
            Map<String, String> request = new HashMap<String, String>();
//            request.put(XmppService.HOST_PARAM, "talk.google.com");
//            request.put(XmppService.PORT_PARAM, "5222");
//            request.put(XmppService.SERVICE_NAME_PARAM, "gmail.com");
//            request.put(XmppService.USERNAME_PARAM, "jeffrey.segal.test@gmail.com");
//            request.put(XmppService.PASSWORD_PARAM, "J@ckb3Pr3st0!");
//            request.put(XmppService.USERNAME_PARAM, "jeffrey.segal");
//            request.put(XmppService.PASSWORD_PARAM, "Dk52%$lwp2%^pdlss");
            request.put(XmppService.USERNAME_PARAM, "michael.ho1");
            request.put(XmppService.PASSWORD_PARAM, "Jackb3Pr3st0!@!@");
//            request.put(XmppService.USERNAME_PARAM, "jsegal");
//            request.put(XmppService.PASSWORD_PARAM, "P@$$w0rd");
            client.getChannel(serviceChannel).publish(request);
            Message message = listener.get();
            client.getChannel(serviceChannel).unsubscribe(listener);
            connected = isOk(message);
        }
        else log.warn("Not handshaken.");
    }

    public void disconnect() throws InterruptedException {
        if (handshaken) {
            log.info("Disconnecting...");
            String serviceChannel = "/service/xmpp/disconnect";
            client.getChannel(serviceChannel).subscribe(listener);
            client.getChannel(serviceChannel).publish(new HashMap<String, String>());

            Thread.sleep(2000);
            client.getChannel(serviceChannel).unsubscribe(listener);
        }
        else log.warn("Not handshaken.");
    }

//    @Test
    public void listMucs() throws InterruptedException {
        if (handshaken) {
            connect();
            if (connected) {
                Map<String, String> request = new HashMap<String, String>();
                request.put(XmppService.CONFERENCE_SERVICE_PARAM, "conference2.chat.dco.dod.mil");
                String serviceChannel = "/service/xmpp/listMucs";
                client.getChannel(serviceChannel).subscribe(listener);
                client.getChannel(serviceChannel).publish(request);

                try {
                    Thread.sleep(2000);
                } catch (InterruptedException e) {
                }

                client.getChannel(serviceChannel).unsubscribe(listener);
            }
        }
    }

//    @Test
    public void joinMuc() throws InterruptedException {
        if (handshaken) {
            connect();
            if (connected) {
                String nickname = "Jeff Segal / J36";
//                String room = "o2e@conference.jeff-pc";
                String room = "jefftest@conference2.chat.dco.dod.mil";
                String roomPassword = "asd";
                String mucChannel = "/data/" + client.getId();
                String serviceChannel = "/service/xmpp/joinMuc";

                client.getChannel(serviceChannel).subscribe(listener);
                client.getChannel(mucChannel).subscribe(listener);

                Map<String, String> request = new HashMap<String, String>();
                request.put(XmppService.NICKNAME_PARAM, nickname);
                request.put(XmppService.ROOM_PARAM, room);
                request.put(XmppService.PASSWORD_PARAM, roomPassword);
                log.info("Sending join request...");
                client.getChannel(serviceChannel).publish(request);

                log.info("Sleeping...");
                Thread.sleep(1000 * 20);

                client.getChannel(mucChannel).unsubscribe(listener);
                client.getChannel(serviceChannel).unsubscribe(listener);
            }
        }
    }

    @Test
    public void sendToMuc() throws InterruptedException {
        if (handshaken) {
            connect();
            if (connected) {
                String nickname = "Mike Ho / J36";
//                String room = "nsldss\\20oa@conference.chat.dco.dod.mil";
                String room = "jefftest@conference2.chat.dco.dod.mil";
                String dataChannel = "/data/" + client.getId();
                String sendToMuc = "/service/xmpp/sendToMuc";
                String joinMuc = "/service/xmpp/joinMuc";
                String leaveMuc = "/service/xmpp/leaveMuc";

                client.getChannel(dataChannel).subscribe(listener);
                client.getChannel(joinMuc).subscribe(listener);
                client.getChannel(sendToMuc).subscribe(listener);
                client.getChannel(leaveMuc).subscribe(listener);

                Map<String, String> joinRequest = new HashMap<String, String>();
                joinRequest.put(XmppService.NICKNAME_PARAM, nickname);
                joinRequest.put(XmppService.ROOM_PARAM, room);
                log.info("Sending join request...");
                client.getChannel(joinMuc).publish(joinRequest);

                log.info("Sleeping...");
                Thread.sleep(1000 * 5);
                Map<String, String> sendRequest = new HashMap<String, String>();
                sendRequest.put(XmppService.ROOM_PARAM, room);
                sendRequest.put(XmppService.TEXT_PARAM, "a message");
                sendRequest.put(XmppService.JSON_PARAM, "{\"foo\":\"bar\"}");
                log.info("Sending sendToMuc request...");
                client.getChannel(sendToMuc).publish(sendRequest);

                log.info("Sleeping...");
                Thread.sleep(1000 * 5);

                Map<String, String> leaveRequest = new HashMap<String, String>();
                leaveRequest.put(XmppService.ROOM_PARAM, room);
                log.info("Sending leave request...");
                client.getChannel(leaveMuc).publish(leaveRequest);

                String room2 = "jefftest@conference2.chat.dco.dod.mil";
                Map<String, String> joinRequest2 = new HashMap<String, String>();
                joinRequest2.put(XmppService.NICKNAME_PARAM, nickname);
                joinRequest2.put(XmppService.ROOM_PARAM, room2);
                log.info("Sending join request #2...");
                client.getChannel(joinMuc).publish(joinRequest2);

                log.info("Sleeping...");
                Thread.sleep(1000 * 25);
                disconnect();

                client.getChannel(dataChannel).unsubscribe(listener);
                client.getChannel(joinMuc).unsubscribe(listener);
                client.getChannel(sendToMuc).unsubscribe(listener);
                client.getChannel(leaveMuc).unsubscribe(listener);
            }

        }
    }

//    @Test
    public void sendToUser() throws InterruptedException {
        if (handshaken) {
            connect();
            if (connected) {
                String dataChannel = "/data/" + client.getId();
                String sendToUser = "/service/xmpp/sendToUser";
                String getRoster = "/service/xmpp/getRoster";

                client.getChannel(sendToUser).subscribe(listener);
                client.getChannel(dataChannel).subscribe(listener);
                client.getChannel(getRoster).subscribe(listener);

                log.info("Sending getRoster request...");
                client.getChannel(getRoster).publish(new HashMap());
                Thread.sleep(1000 * 5);

                Map<String, String> sendRequest = new HashMap<String, String>();
//                sendRequest.put(XmppService.TO_USER_PARAM, "jeffrey.segal@gmail.com");
                sendRequest.put(XmppService.TO_USER_PARAM, "jeffrey.segal@chat.dco.dod.mil");
                sendRequest.put(XmppService.TEXT_PARAM, "a message");
                log.info("Sending sendToUser request...");
                client.getChannel(sendToUser).publish(sendRequest);

                log.info("Sleeping...");
                Thread.sleep(1000 * 5 * 60);
                disconnect();

                client.getChannel(dataChannel).unsubscribe(listener);
                client.getChannel(sendToUser).unsubscribe(listener);
                client.getChannel(getRoster).unsubscribe(listener);
            }
        }
    }

    public boolean isOk(Message message) {
        Integer statusCode = (Integer) cometDTestHelper.getMessageObject(message).get("statusCode");
        return statusCode != null && statusCode == 200;
    }


}
