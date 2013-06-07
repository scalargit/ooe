Ext.define('sw.xmpp.XmppManager', {
    mixins: { observable: 'Ext.util.Observable' },

    connector: null,
    username: null,
    activeChats: [],
    activeMucs: {},

    constructor: function(cfg) {
        Ext.apply(this, cfg);

        this.mixins.observable.constructor.call(this, cfg);

        this.addEvents('usermessage', 'presence', 'connect', 'disconnect');

        // capture window unload event to force disconnect
        Ext.EventManager.addListener(window, 'beforeunload', this.forceDisconnect, this);
    },

    connect: function(username, password, success, error, scope) {
        this.connector.xmppInvoke('connect', {
            username: username,
            password: password
        }, function(data) {
            this.username = username;
            this.fireEvent('connect');
            if (success) success.call(scope || this, data);
        }, function(data) {
            this.username = null;
            o2e.log.error('Error connecting to XMPP server. Your username/password combination may have been incorrect, or your account may be locked. If you try and fail three times, please try to reset your chat account password.', true, data);
            if (error) error.call(scope || this, data);
        }, this);
    },

    connectToHost: function(username, password, host, port, serviceName, success, error, scope) {
        this.connector.xmppInvoke('connect', {
            host: host,
            port: port,
            serviceName: serviceName,
            username: username,
            password: password
        }, function(data) {
            this.username = username;
            this.fireEvent('connect');
            if (success) success.call(scope || this, data);
        }, function(data) {
            this.username = null;
            o2e.log.error('Error connecting to XMPP server. Your username/password combination may have been incorrect, or your account may be locked. If you try and fail three times, please try to reset your chat account password.', true, data);
            if (error) error.call(scope || this, data);
        }, this);
    },

    disconnect: function(success, error, scope) {
        this.connector.xmppInvoke('disconnect', {}, function(data) {
            this.username = null;
            this.fireEvent('disconnect');
            if (success) success.call(scope || this);
        }, function(data) {
            o2e.log.error('Error disconnecting from XMPP server', false, data);
            if (error) error.call(scope || this);
        }, this);
    },

    forceDisconnect: function() {
        if (this.username) this.disconnect();
    },

    getRoster: function(success, error, scope) {
        if (this.username) {
            this.connector.xmppInvoke('getRoster', {}, function(data) {
                for (var x=0,xlen=data.data.presences.length; x<xlen; x++) {
                    if (data.data.presences[x].fromUser.indexOf('/') !== -1) {
                        data.data.presences[x].fromUser = data.data.presences[x].fromUser.split('/')[0];
                    }
                }
                if (success) success.call(scope || this, data);
            }, function(data) {
                o2e.log.error('Error retrieving roster', false, data);
                if (error) error.call(scope || this);
            }, this);
        }
    },

    listMucs: function(service, success, error, scope) {
        if (this.mucs) {
            if (success) success.call(scope || this, this.mucs);
        } else if (this.username) {
            this.connector.xmppInvoke('listMucs', { conferenceService: service || null }, function(data) {
                this.mucs = data.data.mucs;
                if (success) success.call(scope || this, this.mucs);
            }, function(data) {
                o2e.log.error('Error retrieving mucs', false, data);
                if (error) error.call(scope || this);
            }, this);
        }
    },

    getJoinMucDialog: function(handler, scope) {
        this.listMucs(null, function(mucs) {
            Ext.create('Ext.window.Window', {
                title: 'Join Chatroom',
                modal: true,
                collapsible: false,
                draggable: false,
                resizable: false,
                maximizable: false,
                width: 300,
                height: 150,
                layout: 'fit',
                items: [Ext.create('Ext.form.Panel', {
                    border: 0,
                    bodyPadding: 10,
                    monitorValid: true,
                    layout: 'anchor',
                    defaults: { xtype: 'textfield', allowBlank: false, anchor: '100%' },
                    items: [{
                        fieldLabel: 'Chatroom',
                        name: 'chatroom',
                        xtype: 'combobox',
                        forceSelection: true,
                        blankText: 'Select a valid chatroom.',
                        msgTarget: 'under',
                        typeAhead: true,
                        store: Ext.create('Ext.data.Store', { fields: ['name', 'jid'], data: mucs }),
                        queryMode: 'local',
                        displayField: 'name',
                        valueField: 'jid',
                        listeners: {
                            beforequery: function (e) {
                                e.cancel = true;
                                //More flexible filtering
                                var query=new RegExp('/*'+e.query+'/*');
                                this.expand();
                                this.store.clearFilter(true);
                                this.store.filter(this.displayField, query);
                            }
                        }
                    }, {
                        fieldLabel: 'Nickname',
                        name: 'nickname',
                        allowBlank: true
                    }, {
                        fieldLabel: 'Password',
                        name: 'password',
                        allowBlank: true
                    }],
                    bbar: [{
                        text: 'Join',
                        handler: function(btn) {
                            var info = btn.ownerCt.ownerCt.getForm().getValues();
                            if (!info.nickname || info.nickname === '') {
                                info.nickname = this.username;
                            }
                            handler.call(scope || this, info);
                            btn.ownerCt.ownerCt.ownerCt.close();
                        },
                        scope: this,
                        formBind: true
                    },{
                        text: 'Cancel',
                        handler: function(btn) {
                            btn.ownerCt.ownerCt.ownerCt.close();
                        }
                    }],
                    listeners: {
                        afterrender: {
                            fn: function(p) {
                                p.keyNav = Ext.create('Ext.util.KeyNav', p.el, {
                                    enter: function() {
                                        if (this.getForm().isValid()) {
                                            this.getEl().mask('Please wait...');
                                            var info = this.getForm().getValues();
                                            if (!info.nickname || info.nickname === '') {
                                                info.nickname = o2e.env.xmppMgr.username;
                                            }
                                            if (!info.password) {
                                                info.password = '';
                                            }
                                            handler.call(scope || this, info);
                                            this.ownerCt.close();
                                        }
                                    },
                                    scope: p
                                });
                            },
                            scope: this
                        }
                    }
                })]
            }).show();
        }, function() {
            Ext.Msg.alert('Error joining chatroom', 'An error occurred while retrieving a list of chatrooms. Please contact your administrator.');
        }, this);
    },

    joinMuc: function(caller, room, nickname, password, success, error, scope) {
        if (!this.username) {
            o2e.log.warn('You are not connected to the chat server.');
            scope.fireEvent('servicestatus', 'Chatroom', o2e.data.DataUtils.serviceStatus.ERROR, 'You must connect to the chat server to join chatroom '+room);
        } else {
            if (this.activeMucs[room]) {
                if (!Ext.Array.contains(this.activeMucs[room], caller)) {
                    this.activeMucs[room].push(caller);
                }
            } else {
                this.activeMucs[room] = [caller];
            }
            this.connector.xmppInvoke('joinMuc', {
                nickname: nickname,
                room: room,
                password: password
            }, function(data) {
                //Confirm successful join by validating this room is initialized already
                if (this.activeMucs[room] && this.activeMucs[room].length > 0 && data.message.indexOf(room) ) {
                    scope.fireEvent('servicestatus', 'Chatroom', o2e.data.DataUtils.serviceStatus.INFO, 'Successfully joined chatroom '+room);
                }
            }, function(data) {
                //TODO: Work with Jeff to see if there is a better way to figure out if the message is being passed back in reference to the room we are interested in
                if (data.message.indexOf(room) !== -1) {
                    //Throw error to user, write to service status log, clean up the chatroom array and close the room
                    Ext.Msg.alert('Error joining chatroom', 'An error occured while attempting to connect to ' + room);
                    scope.fireEvent('servicestatus', 'Chatroom', o2e.data.DataUtils.serviceStatus.INFO, 'Failed to join chatroom '+room);
                    caller.close();
                    if (this.activeMucs[room]) {
                        Ext.Array.remove(this.activeMucs[room], caller);
                    }
                }
            }, this);  
        }
    },

    leaveMuc: function(caller, room, success, error, scope) {
        if (!this.username) {
            o2e.log.warn('You are not connected to the chat server.');
        } else {
            if (this.activeMucs[room]) {
                Ext.Array.remove(this.activeMucs[room], caller);
                if (this.activeMucs[room].length === 0) {
                    this.connector.xmppInvoke('leaveMuc', {
                        room: room
                    }, success || Ext.emptyFn, error || this._onError, scope || this);
                }
            }
        }
    },

    sendToMuc: function(room, message, attachment, success, error, scope) {
        if (!this.username) {
            o2e.log.warn('You are not connected to the chat server.');
        } else {
            this.connector.xmppInvoke('sendToMuc', {
                text: message,
                room: room,
                json: attachment
            }, success || Ext.emptyFn, error || this._onError, scope || this);
        }
    },

    sendToUser: function(toUser, message, attachment, success, error, scope) {
        if (!this.username) {
            o2e.log.warn('You are not connected to the chat server.');
        } else {
            this.connector.xmppInvoke('sendToUser', {
                text: message,
                toUser: toUser,
                json: attachment
            }, success || Ext.emptyFn, error || this._onError, scope || this);
        }
    },

    receivePacket: function(data) {
        o2e.log.info('Received packet: '+data.message, false, data);
        var pType = data.data.packetType;
        if (pType === 'org.jivesoftware.smack.packet.Message') {
            if (data.data.messageType === 'groupchat') {
                var fromInfo = data.data.fromUser.split('/'),
                    room = fromInfo[0],
                    fromUser = fromInfo[1],
                    fromJid = data.data.fromJid ? data.data.fromJid.split('/')[0] : null;
                if (this.activeMucs[room]) {
                    var x, xlen, caller, deadCallers = [];
                    for (x=0,xlen=this.activeMucs[room].length; x<xlen; x++) {
                        caller = this.activeMucs[room][x];
                        if (caller && caller.handleMessage) {
                            caller.handleMessage(fromUser, fromJid, data.data.timestamp || null, data.data.bodies)
                        } else {
                            // cleanup
                            deadCallers.push(caller);
                        }
                    }
                    // finish cleanup
                    for (x=0,xlen=deadCallers.length; x<xlen; x++) {
                        Ext.Array.remove(this.activeMucs[data.data.room], deadCallers[x]);
                    }
                    this.fireEvent('usermessage', room); //trigger alerting
                }
            } else if (data.data.bodies) {
                var fromUser = data.data.fromUser.indexOf('/') === -1 ? data.data.fromUser : data.data.fromUser.split('/')[0];
                if (this.fireEvent('usermessage', fromUser, data.data.bodies) !== false) {
                    // open new widget because nobody accepted the message from the event
                    var widgetMeta = { services: {}, widgetCt: { title: 'XMPP Chat'}, initToUser: fromUser, initMessage: data.data.bodies, alertActive: false };
                    o2e.app.viewport.getComponent('mainContentPanel').addWidget('chat', widgetMeta);
                }
            } else {
                o2e.log.debug('Receiving chat state message: '+data.data.chatState, false, data.data);
            }
        } else if (pType === 'org.jivesoftware.smack.packet.Presence') {
            var userInfo = data.data.fromUser.split('/');
            if (userInfo[0].indexOf('conference') !== -1) {
                var chatroom = userInfo[0],
                    nickname = userInfo[1],
                    jid = data.data.fromJid ? data.data.fromJid.split('/')[0] : null;

                if (this.activeMucs[chatroom]) {
                    var x, xlen, caller, deadCallers = [];
                    for (x=0,xlen=this.activeMucs[chatroom].length; x<xlen; x++) {
                        caller = this.activeMucs[chatroom][x];
                        if (caller && caller.handlePresence) {
                            caller.handlePresence(data.data.fromUser, jid, data.data.presenceType);
                            if (data.data.presenceType === 'unavailable') {
                                caller.handleMessage(nickname, jid, data.data.timestamp || null, '<i>' + nickname + ' has left the room.</i>');
                            }
                            //TODO: talk to Jeff about why I always get 2 available messages and see if we can fix that
                        } else {
                            // cleanup
                            deadCallers.push(caller);
                        }
                    }
                    // finish cleanup
                    for (x=0,xlen=deadCallers.length; x<xlen; x++) {
                        Ext.Array.remove(this.activeMucs[chatroom], deadCallers[x]);
                    }
                }
            } else {
                this.fireEvent('presence', userInfo[0], data.data.presenceType);
                this.fireEvent('usermessage', userInfo[0], "<i>" + userInfo[0] + " is " + data.data.presenceType + ".</i>");
            }
        }
    },

    _onError: function(data) {
        o2e.log.error('Error occurred communicating with XMPP server: '+data.message, false, data);
    }
});