package org.o2e.xmpp;

import org.jivesoftware.smack.packet.PacketExtension;
import org.jivesoftware.smackx.packet.DelayInfo;
import org.jivesoftware.smackx.packet.DelayInformation;
import org.xmlpull.v1.XmlPullParser;

/**
 * Created by IntelliJ IDEA.
 * User: Jeff
 * Date: 10/29/12
 * Time: 11:31 AM
 * To change this template use File | Settings | File Templates.
 */
public class OoeDelayInfoProvider extends OoeDelayInformationProvider {

    @Override
    public PacketExtension parseExtension(XmlPullParser parser) throws Exception {
        return new DelayInfo((DelayInformation) super.parseExtension(parser));
    }

}
