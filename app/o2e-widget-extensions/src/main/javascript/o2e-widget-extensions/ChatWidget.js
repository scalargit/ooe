Ext.define('o2e.ChatWidget', {
    extend: 'o2e.widget.AbstractWidget',
    type: 'chat',

    useRawData: false,
    useOwnStores: true,
    unionData: true,

    requiredAnnotations: [],
    optionalAnnotations: [],

    cm: [
        {name: 'from', header: "From", dataIndex: 'from'},
        {name: 'fromJid', header: "From Full", dataIndex: 'fromJid'},
        {name: 'fromCls', header: "Date", dataIndex: 'fromCls'},
        {name: 'time', header: 'Time', dataIndex: 'time'},
        {name: 'timeCls', header: 'Time Class', dataIndex: 'timeCls'},
        {name: 'body', header: 'Body', dataIndex: 'body'},
        {name: 'bodyCls', header: 'Body Class', dataIndex: 'bodyCls'},
        {name: 'attachment', header: 'Attachment', dataIndex: 'attachment', hidden: true},
        {name: 'showTimestamps', header: 'Timestamps Visible', dataIndex: 'showTimestamps'}
    ],

    msgViewTpl: ['<tpl for=".">',
      '<div class="chatRow" style="padding:5px;border-bottom:1px solid #DDD;">',
          '<span class="chatWidgetTime {timeCls}"',
              '<tpl if="!showTimestamps">',
              ' style="display:none;"',
              '</tpl>',
          '>({time})&nbsp;</span>',
          '<span class="{fromCls}" data-qtip="{fromJid}">{from}</span>',
          ':&nbsp;',
          '<span class="{bodyCls}">',
            '<tpl if="attachment">',
                '<a href="javascript:void(0)">',
            '</tpl>',
            '{body}',
            '<tpl if="attachment">',
                '</a>',
            '</tpl>',
        '</span>',
      '</div>',
      '</tpl>'],

    initChatroom: false,
    initToUser: null,
    configuredChats: null,
    alertActive: false,

    init: function() {
        this.tabPanel = Ext.create('Ext.tab.Panel', {
            border: 0,
            items: []
        });
        this.add(this.tabPanel);
        this.setup();
        this.setReady();

        this.doLayout();
    },

    setup: function() {
        if (this.configuredChats) {
            for (var x=0,xlen=this.configuredChats.length;x<xlen;x++) {
                this.getNewChatInterface(this.configuredChats[x]);
            }
            this.tabPanel.setActiveTab(this.activeChat);
        } else if (this.initToUser) {
            this.getNewChatInterface({ southHeight: 50, isChatroom: this.initChatroom, toUser: this.initToUser, nickname: this.initNickname });
        }
    },

    getNewChatInterface: function(cfg) {
        var listView = Ext.create('Ext.view.View', {
            itemId: 'listview',
            store: new Ext.data.ArrayStore({fields:this.cm}),
            region: 'center',
            autoScroll: true,
            itemSelector: 'div.chatRow',
            overClass: 'x-list-over',
            tpl: this.msgViewTpl,
            style: 'background: #FFFFFF',
            listeners: {
                itemclick: {
                    fn: function(view, record, h, idx, e, eOpts) {
                        var type, id, metadata, attachment = record.get('attachment');
                        if (attachment) {
                            type = attachment.type,
                            id = attachment.id,
                            metadata = attachment.metadata;

                            if (type === 'services') {
                                o2e.app.viewport.getComponent('mainContentPanel').addWidgetFromService(id, null);
                            } else if (type === 'apps') {
                                o2e.serviceRegistry.registry.replace(id, metadata);
                                o2e.app.viewport.getComponent('mainContentPanel').addWidget('html', o2e.widgetFactory.convertMetadata(id, metadata, 'html'));
                            } else if (type === 'udops') {
                                o2e.app.openUdop(id);
                            } else if (type === 'gmapKml') {
                                // TODO
                            } else if (type === 'widgetInstance') {
                                o2e.connectorMgr.query({
                                    componentId: this.id,
                                    serviceId: 'SYSTEM_collection_get',
                                    params: {
                                        uuid: id,
                                        collection: 'widgetinstance'
                                    },
                                    success: function (serviceKey, data, forceRefresh) {
                                        var service, widget = data.json;
                                        for (service in widget.services) {
                                            if (widget.services.hasOwnProperty(service)) {
                                                o2e.serviceRegistry.get(service.substring(0, service.indexOf('|')), Ext.emptyFn);
                                            }
                                        }
                                        o2e.app.viewport.getComponent('mainContentPanel').addWidget(widget.widgetTypeId, widget);
                                    },
                                    failure: this._onError,
                                    scope: o2e.serviceRegistry
                                });
                            }
                        }
                    },
                    scope: this
                }
            }
        });

        var outgoingBox = Ext.create('Ext.form.field.TextArea', {
            itemId: 'outgoingbox',
            autoScroll : true,
            region: 'south',
            split: true,
            height: cfg.southHeight,
            enableKeyEvents :true,
            disabled: !o2e.env.xmppMgr.username,
            isChatroom: cfg.isChatroom,
            toUser: cfg.toUser,
            attachment: null,
            listeners : {
                keypress : {
                    fn : function(field, e) {
                        if (e.getCharCode() == 13) {
                            var msg = field.getValue(),
                                attachment = field.attachment;
                            if (attachment) { attachment = Ext.encode(attachment); }
                            if (msg.length > 0) {
                                o2e.env.xmppMgr[field.isChatroom ? 'sendToMuc' : 'sendToUser'](field.toUser, msg, attachment);
                                if (!field.isChatroom) {
                                    this.addMessage(field.ownerCt, msg, o2e.env.xmppMgr.username, null, Ext.Date.format(new Date(), "m-d H:i"), true, attachment);
                                }
                            }
                            field.reset();
                            field.attachment = null;
                            e.preventDefault();
                        }
                    },
                    scope : this
                },
                afterrender: {
                    fn: function() {
                        this.initializeDropTarget(outgoingBox);
                    },
                    scope: this
                }
            }
        });

        var presencePanel;
        if (cfg.isChatroom) {
            presencePanel = Ext.create('Ext.grid.Panel', {
                itemId: 'presencePanel',
                autoScroll: true,
                split: true,
                region: 'east',
                collapsible: true,
                collapseMode: 'mini',
                width: 80,
                collapsed: false,
                border: 2,
                store: Ext.create('Ext.data.Store', {
                    model: 'buddy',
                    sorters: ['presenceType', 'fromUser']
                }),
                columnLines: true,
                columns: [{
                    flex     : 1,
                    dataIndex: 'fromUser',
                    header: 'Users',
                    renderer: function(v, md, r) {
                        var jid = r.get('fromJid');
                        if (jid) {
                            return '<span data-qtip="'+ jid + '">' + v + ' ('+ jid + ')</span>';
                        } else {
                            return v;
                        }
                    }
                }],
                viewConfig: {stripeRows: true, emptyText: 'No Users Found.'}
            });
        }
        //per J. Brunderman: truncate the room name to only show the content before the *
        var shortenedTitle=cfg.toUser.split('@')[0];
        var panel = this.tabPanel.add(Ext.create('Ext.panel.Panel', {
            title: shortenedTitle,
			layout: 'border',
			border: false,
			bodyBorder: false,
            closable: true,
            chatCfg: cfg,
			items : cfg.isChatroom ? [listView, outgoingBox, presencePanel] : [listView, outgoingBox]
		}));

        this.tabPanel.setActiveTab(panel);

        if (this.initMessage) {
            panel.on('afterrender', function() {
                this.addMessage(panel, this.initMessage, cfg.toUser, null, Ext.Date.format(new Date(), "m-d H:i"), true, null);
            }, this);
        }

        var connectCb = Ext.bind(function(lv, b, p, chatCfg) {
            if (chatCfg.isChatroom) {
                lv.getStore().removeAll();
                o2e.env.xmppMgr.joinMuc(p, chatCfg.toUser, chatCfg.nickname, chatCfg.password, Ext.emptyFn, Ext.emptyFn, this);
            }
            lv.getEl().unmask();
            b.enable();
            this.fireEvent('servicestatus', 'Chat Status', o2e.data.DataUtils.serviceStatus.INFO, 'Connected to server.');
        }, this, [listView, outgoingBox, panel, cfg], 0);
        var disconnectCb = Ext.bind(function(lv, b) {
            lv.getEl().mask('Not Connected');
            b.disable();
            this.fireEvent('servicestatus', 'Chat Status', o2e.data.DataUtils.serviceStatus.ERROR, 'Disconnected from server.');
        }, this, [listView, outgoingBox], 0);
        o2e.env.xmppMgr.on('connect', connectCb);
        o2e.env.xmppMgr.on('disconnect', disconnectCb);
        panel.on('beforedestroy', Ext.bind(function(ccb, dccb) {
            o2e.env.xmppMgr.un('connect', ccb);
            o2e.env.xmppMgr.un('disconnect', dccb);
        }, this, [connectCb, disconnectCb], 0));

        if (cfg.isChatroom) {
            panel.handleMessage = Ext.bind(function(p, from, fromJid, time, msg) {
                this.addMessage(p, msg, from, fromJid, Ext.Date.format((time === null ? new Date() : new Date(time)), "m-d H:i"), time === null, null);
            }, this, [panel], 0);
            panel.handlePresence = Ext.bind(function(p, from, jid, presence) {
                var userInfo = from.split('/'),
                    pStore = p.getStore(),
                    idx = pStore.findExact('fromUser', userInfo[1]);
                if (idx === -1 && presence === 'available') {
                    pStore.add({ fromUser: userInfo[1], fromJid: jid, presenceType: presence });
                } else if (idx !== -1 && presence === 'unavailable') {
                    pStore.removeAt(idx)
                }
            }, this, [presencePanel], 0);
            panel.on('beforedestroy', Ext.bind(function(p, room) {
                o2e.env.xmppMgr.leaveMuc(p, room);
            }, this, [panel, cfg.toUser], 0));
            o2e.env.xmppMgr.joinMuc(panel, cfg.toUser, cfg.nickname, cfg.password, Ext.emptyFn, Ext.emptyFn, this);
            this.fireEvent('servicestatus', 'Chatroom', o2e.data.DataUtils.serviceStatus.INFO, 'Attempting to join chatroom '+cfg.toUser);
        } else {
            var msgCb = Ext.bind(function(p, fromUser, message) {
                if (fromUser === p.getComponent('outgoingbox').toUser) {
                    this.addMessage(p, message, fromUser, null, Ext.Date.format(new Date(), "m-d H:i"), true, null);
                    return false;
                }
            }, this, [panel], 0);
            o2e.env.xmppMgr.on('usermessage', msgCb);
            panel.on('beforedestroy', Ext.bind(function(fn) {
                o2e.env.xmppMgr.un('usermessage', fn);
            }, this, [msgCb], 0));
            this.fireEvent('servicestatus', 'Chat', o2e.data.DataUtils.serviceStatus.INFO, 'Chat initiated with '+cfg.toUser);
        }
    },

    initializeDropTarget: function(cmp) {
        cmp.ddTarget = Ext.create('Ext.dd.DropTarget', cmp.el, {
            ddGroup: 'services',
            notifyEnter: function(ddSource, e, data) {
                ddSource.serviceDropAllowed = true;
                cmp.el.stopAnimation();
                cmp.el.highlight();
                return this.dropAllowed;
            },
            notifyOver: function(ddSource, e, data) {
                return ddSource.serviceDropAllowed === true ? this.dropAllowed : this.dropNotAllowed;
            },
            notifyDrop  : function(ddSource, e, data){
                var group = ddSource.ddGroup,
                    rec = ddSource.dragData.records[0],
                    metadata = rec.get('metadata'),
                    id = rec.get('id'),
                    // SW URLs
                    baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname,
                    embedPath = '?embed=true&hideToolbar=true&hideTitleBar=true',
                    widgetParam = '&widget=',
                    widgetInstanceParam = '&widi=',
                    udopParam = '&udop=',
                    // Presto URL
                    prestoUrl = (o2e.env.prestoSecure ? 'https' : 'http') + '://' + o2e.env.prestoHost + ':' + o2e.env.prestoPort,
                    prestoFiles = prestoUrl + '/presto/files/system/mashlets/' + id + '/index.html',
                    appLauncher = prestoUrl + '/presto/hub/applauncher.html?mid=' + id;

                if (group === 'services') {
                    cmp.setValue(baseUrl + embedPath + widgetParam + id);
                    cmp.attachment = { type: group, id: id, metadata: metadata };
                    cmp.focus();
                } else if (group === 'udops') {
                    cmp.setValue(baseUrl + udopParam + id);
                    cmp.attachment = { type: group, id: id, metadata: metadata };
                    cmp.focus();
                } else if (group === 'apps') {
                    var mdid = 'PrestoApp_' + id,
                        md;

                    Ext.Ajax.request({
                        url: prestoFiles,
                        success: function() {
                            md = {
                                "_id": mdid,
                                "id": mdid,
                                "clientConnector":"ungoverned",
                                "connectorAction":"invoke",
                                "connectionType":"HTML",
                                "name":metadata.name,
                                "description":metadata.description,
                                "category":metadata.categories && metadata.categories.length ? metadata.categories[0] : 'Uncategorized',
                                "tags":metadata.tags,
                                "recordBreak":"html.info",
                                "request":[{"name":"url","header":"URL","defaultValue":prestoFiles}],
                                "response":[{"name":"url","header":"URL","defaultValue":"","annotations":[],"ignore":false}],
                                "refreshIntervalSeconds":60,
                                "type":'html',
                                "viz":{"html":{}}
                            };
                            cmp.setValue(prestoFiles);
                            cmp.attachment = { type: group, id: id, metadata: md };
                            cmp.focus();
                        },
                        failure: function() {
                            md = {
                                "_id": mdid,
                                "id": mdid,
                                "clientConnector":"ungoverned",
                                "connectorAction":"invoke",
                                "connectionType":"HTML",
                                "name":metadata.name,
                                "description":metadata.description,
                                "category":metadata.categories && metadata.categories.length ? metadata.categories[0] : 'Uncategorized',
                                "tags":metadata.tags,
                                "recordBreak":"html.info",
                                "request":[{"name":"url","header":"URL","defaultValue":appLauncher}],
                                "response":[{"name":"url","header":"URL","defaultValue":"","annotations":[],"ignore":false}],
                                "refreshIntervalSeconds":60,
                                "type":'html',
                                "viz":{"html":{}}
                            };
                            cmp.setValue(appLauncher);
                            cmp.attachment = { type: group, id: id, metadata: md };
                            cmp.focus();
                        }
                    });
                } else if (group === 'gmapKml') {
                    // TODO: figure this out
                }

                return true;
            }
        });

        cmp.ddTarget.addToGroup('apps');
        cmp.ddTarget.addToGroup('udops');
        // TODO: support KML // cmp.ddTarget.addToGroup('gmapKml');
    },

    addMessage: function(chatpanel, message, from, fromJid, time, timeEstimated, attachment) {
		var fromCls = 'chatWidgetFromLabel';
		var bodyCls = 'chatWidgetFromBody';
		var timeCls = timeEstimated ? 'chatWidgetFromTimeEstimated' : 'chatWidgetFromTime';
		if (from !== o2e.env.xmppMgr.username) {
			fromCls = 'chatWidgetToLabel';
			bodyCls = 'chatWidgetToBody';
			timeCls = timeEstimated ? 'chatWidgetToTimeEstimated' : 'chatWidgetToTime';
		}

        if (Ext.isArray(message)) {
            for (var x=0,xlen=message.length; x<xlen; x++) {
                if (message[x].language === 'json') {
                    attachment = message[x].body;
                } else {
                    message = message[x].body;
                }
            }
        }

		o2e.log.debug("Adding message from "+from+": "+message);

        if (fromJid === null) {
            fromJid = from;
        }

		if (!attachment) {
			message = message.replace(/<\/a>/gi, "");
			message = message.replace(/<a.*>/gi, "");
	        message = message.replace(/(http[s]*:\/\/\S+)/gi, "<a href=\"$1\" target='_blank'>$1</a>");
		} else {
            attachment = Ext.decode(attachment);
        }

		var store = chatpanel.getComponent('listview').getStore().add({
            from: from,
            fromJid: fromJid,
            fromCls: fromCls,
            time: time,
            timeCls: timeCls,
            body: message,
            bodyCls: bodyCls,
            attachment: attachment,
            showTimestamps: true
        });

        var d = chatpanel.getComponent('listview').getEl().dom;
			d.scrollTop = d.scrollHeight - d.offsetHeight + 3;
    },

    getStateConfig: function() {
        var tp = this.tabPanel,
            items = tp.items,
            at = tp.getActiveTab(),
            x, xlen, currTab, activeTab, tabs = [];
        for (x=0,xlen=items.getCount();x<xlen;x++) {
            currTab = items.getAt(x);
            tabs[x] = currTab.chatCfg;
            if (at === currTab) {
                activeTab = x;
            }
        }
        return Ext.apply({
            configuredChats: tabs,
            activeChat: activeTab,
            alertActive: this.alertActive
        }, this.callParent());
    }
});