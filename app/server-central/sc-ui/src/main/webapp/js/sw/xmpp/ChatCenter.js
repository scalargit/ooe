Ext.define('o2e.xmpp.ChatCenter', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.chatcenter',

    initComponent: function() {
        Ext.apply(this, {
            layout: 'border',
            items : [{
                xtype: 'buddylist',
                region: 'west',
                collapsed: false,
                collapsible: true,
                hideCollapseTool: true,
                split: true,
                width: 103
            },{
                region: 'center',
                border: 0,
                layout: { type: 'hbox', align: 'stretch' }
            }],
            tools: [{
                id: 'chatroom',
                qtip: 'Join a Chatroom',
                handler: function() {
                    o2e.env.xmppMgr.getJoinMucDialog(function(cfg) {
                        this.addChat(cfg.chatroom, cfg.nickname, true);
                    });
                },
                scope: this,
                hidden: true
            },
            {
                id: 'connect',
                qtip: 'Connect to Chat Server',
                handler: function(event, el, header, tool) {
                    o2e.env.xmppMgr.on('presence', header.ownerCt.handlePresence, header.ownerCt);

                    var win = Ext.create('sw.xmpp.ConnectDialog', {
                        connectHandler: function(data) {
                            o2e.env.xmppMgr.getRoster(function(data) {
                                header.ownerCt.body.unmask();
                                tool.hide();
                                header.getComponent('chatroom').show();
                                header.getComponent('disconnect').show();
                                header.ownerCt.loadBuddies(data.data.presences);
                                win.getEl().unmask();
                                win.close();
                            }, Ext.emptyFn, this);
                        }
                    });
                    win.show();
                }
            },
            {
                id: 'disconnect',
                qtip: 'Disconnect from Chat Server',
                handler: function(event, el, header, tool) {
                    o2e.env.xmppMgr.disconnect(function() {
                        header.ownerCt.removeBuddies();
                        header.ownerCt.body.mask('Not Connected', '');
                        tool.hide();
                        header.getComponent('chatroom').hide();
                        header.getComponent('connect').show();
                        o2e.env.xmppMgr.un('presence', header.ownerCt.handlePresence, header.ownerCt);
                    }, Ext.emptyFn, this);
                },
                hidden: true
            }]
        });

        this.callParent();

        this.on('expand', function() {
            if (!this.chat) {
                o2e.widgetFactory.create(
                    'chat',
                    { services: {}, widgetCt: { closable: false, preventMaximize: true, collapsible: false, margins: 0 }, initToUser: null, alertActive: false}, 'sw-widgetcontainer',
                    null,
                    function(w) {
                        this.chat = this.getComponent(1).add(w);
                    },
                    this
                );
            }

            if (!o2e.env.xmppMgr.username) {
                this.body.mask('Not Connected', '');
            } else {
                this.body.unmask();
            }
        }, this);
    },

    loadBuddies: function(buddies) {
        this.down('buddylist').loadBuddies(buddies);
    },

    removeBuddies: function() {
        this.down('buddylist').removeBuddies();
    },

    handlePresence: function(username, available) {
        this.down('buddylist').handlePresence({ fromUser: username, presenceType: available });
    },

    addChat: function(user, nick, isChatroom) {
        this.chat.widget.getNewChatInterface({ southHeight: 50, isChatroom: isChatroom, toUser: user, nickname: nick });
    }
});