Ext.define('sw.xmpp.BuddyList', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.buddylist',

    border: 0,

    initComponent: function() {
        var tools = [{
            id: 'chat-help',
            qtip: 'Chat Help',
            type: 'custom-help',
            handler: function() {
                //Open Help to the Chat section
                window.open("/strategicwatch-help/doc17850.htm#_Toc333221599","mywindow","scrollbars=1,width=600,height=800");
            },
            hidden: false
        },{
            id: 'chatroom',
            qtip: 'Join a Chatroom',
            handler: function() {
                o2e.env.xmppMgr.getJoinMucDialog(function(cfg) {
                    var widgetMeta = { services: {}, widgetCt: { title: 'XMPP Chat'}, initToUser: cfg.chatroom, initChatroom: true, initNickname: cfg.nickname, alertActive: false};
                    o2e.app.viewport.getComponent('mainContentPanel').addWidget('chat', widgetMeta);
                });
            },
            hidden: true
        },
        {
            id: 'connect',
            qtip: 'Connect to Chat Server',
            handler: function(event, el, header, tool) {
                header.ownerCt.presenceHandler = function(username, available) {
                    var record, pStore = this.getStore(), idx = pStore.findExact('fromUser', username);
                    if (idx !== -1) {
                        pStore.removeAt(idx);
                    }
                    pStore.add({ fromUser: username, presenceType: available });
                    pStore.sort(pStore.sorters.getRange());
                };
                o2e.env.xmppMgr.on('presence', header.ownerCt.presenceHandler, header.ownerCt);

                var win = Ext.create('sw.xmpp.ConnectDialog', {
                    connectHandler: function(data) {
                        o2e.env.xmppMgr.getRoster(function(data) {
                            header.ownerCt.body.unmask();
                            tool.hide();
                            header.getComponent('chatroom').show();
                            header.getComponent('disconnect').show();
                            header.ownerCt.getStore().loadData(data.data.presences);
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
                    header.ownerCt.getStore().removeAll();
                    header.ownerCt.body.mask('Not Connected', '');
                    tool.hide();
                    header.getComponent('chatroom').hide();
                    header.getComponent('connect').show();
                    o2e.env.xmppMgr.un('presence', header.ownerCt.presenceHandler, header.ownerCt);
                }, Ext.emptyFn, this);
            },
            hidden: true
        }];

        Ext.define('buddy', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'fromUser', type: 'string' },
                { name: 'fromJid', type: 'string' },
                { name: 'presenceType', type: 'string' }
            ]
        });

        this.store = Ext.create('Ext.data.Store', {
            model: 'buddy',
            sorters: ['presenceType', 'fromUser']
        });

        Ext.apply(this, {
            columnLines: true,
            columns: [
                {
                    flex     : 1,
                    dataIndex: 'fromUser',
                    renderer: function(v, md, r) {
                        md.tdAttr = 'data-qtip="Status: ' + r.get('presenceType') + '"';
                        if (r.get('presenceType') === 'available') {
                            return '<b>' + v + '</b>';
                        } else {
                            return '<span style="color:#999"><i>' + v + '</i></span>'
                        }
                    }
                }
            ],
            tools: tools,
            viewConfig: {
                stripeRows: true,
                emptyText: 'No buddies found.'
            }
        });

        this.callParent();

        this.on('afterlayout', function(grid) {
            grid.headerCt.hide();

            if (!o2e.env.xmppMgr.username) {
                grid.body.mask('Not Connected', '');
            } else {
                grid.body.unmask();
            }
        });

        this.on('itemclick', function(v, m) {
            var widgetMeta = { services: {}, widgetCt: { title: 'XMPP Chat'}, initToUser: m.get('fromUser'), alertActive: false};
            o2e.app.viewport.getComponent('mainContentPanel').addWidget('chat', widgetMeta);
        });
    }
});