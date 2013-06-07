Ext.define('sw.xmpp.JoinMuc', {

    extend: 'o2e.plugin.AbstractConfigPlugin',
    widgetType: 'chat',

    /**
     * @cfg iconCls
     */
    iconCls: 'icon-chatroom-add',
    /**
     * @cfg text
     */
    text: 'Join Chatroom',
    /**
     * @cfg pluginId
     */
    pluginId: 'joinMuc',
    defaultItemClass: 'Ext.menu.Item',

    handleMenuItemClick: function(item, e) {
        o2e.env.xmppMgr.getJoinMucDialog(function(cfg) {
            this.widget.getNewChatInterface({
                southHeight: 50,
                isChatroom: true,
                toUser: cfg.chatroom,
                nickname: cfg.nickname
            });
        }, this);
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});