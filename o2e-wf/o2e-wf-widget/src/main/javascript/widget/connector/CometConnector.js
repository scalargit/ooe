/**
 * @class o2e.connector.CometConnector
 * @extends o2e.connector.AbstractConnector
 * 
 * Includes Ext.Ajax-based implementation of CometD Transports and CometD integration of Ext.JSON.
 * 
 * TODO: Did not include CallbackPollingTransport (JSONP). Need see how this is done in Ext4.
 */
Ext.define('o2e.connector.CometConnector', {
    extend: 'o2e.connector.AbstractConnector',

    type: 'comet',

    /**
     * Read-only
     * @type {Boolean}
     * @property connected
     */
    connected: false,
    
    /**
     * Read-only
     * @type {org.cometd.CometD}
     * @property cometd
     */
    cometd: null,

    /**
     * @constructor
     * @param {Object} config
     */
    constructor : function(config) {
        var me = this;

        Ext.apply(this, config);
        this.callParent([config]);
        
        this.addEvents(
            /**
             * @event connect
             * @param {Boolean} successful
             */
            'connect',
            /**
             * @event disconnect
             * @param {Boolean} successful
             */
            'disconnect',
            /**
             * @event reconnect
             */
            'reconnect',
            /**
             * @event userauth
             * @param {Object} userAuth User authentication Object containing and Authorities array and the username
             */
            'userauth'
        );
        
        // Use Ext implementations for to/from JSON (this is required)
        org.cometd.JSON.toJSON = Ext.JSON.encode;
        org.cometd.JSON.fromJSON = Ext.JSON.decode;
        
        // Create the cometd instance
        this.cometd = new org.cometd.Cometd();

        // Remap toolkit-specific transport calls (this is required)
        this.cometd.LongPollingTransport = function() {
            var _super = new org.cometd.LongPollingTransport(), transport = org.cometd.Transport.derive(_super);
            transport.xhrSend = function(packet) {
                var x,xlen,j = Ext.decode(packet.body);
                for (x=0,xlen=j.length;x<xlen;x++) {
                    if (j[x].o2uuid) {
                        me.idMap[j[x].id] = j[x].o2uuid;
                    }
                }
                return Ext.Ajax.request({
                    url: packet.url,
                    method: 'POST',
                    contentType: 'application/json;charset=UTF-8',
                    jsonData: packet.body,
                    headers: packet.header,
                    success: function(response, options) {
                        if (response && response.responseText) {
                            packet.onSuccess(Ext.decode(response.responseText));
                        }
                    },
                    failure: packet.onError
                });
            };
            return transport;
        };
        this.cometd.registerTransport('long-polling', new this.cometd.LongPollingTransport());
        
        if (this.allowCrossDomain) {
            //CallbackPollingTransport implementation goes here (needed for cross-domain)
            throw "Cross Domain is not currently supported";
        }
        
        if (this.allowWebSocket && window.WebSocket) {
            this.cometd.registerTransport('websocket', new org.cometd.WebSocketTransport());
        }

        this.idMap = {};
        this.dataHashMap = {};
        this.subscribedChannels = {};
        this.subscribedServiceKeys = {};
        this.pendingSubscribedServiceKeys = [];
        this.privateRoutes = {};
        this.synchServiceKeys = {};
        this.pendingSynchSubscriptions = {};
        this.buffers = {};
    },

    // inherited
    isConnected: function() {
        return this.connected;
    },

    /**
     * Connect to the comet server
     */
    connect: function() {
        var me = this;
        me.cometd.addListener('/meta/handshake', Ext.bind(me._onHandshake, me));
        me.cometd.addListener('/meta/connect', Ext.bind(me._onConnect, me));
        me.cometd.addListener('/meta/disconnect', Ext.bind(me._onDisconnect, me));
        me.cometd.init({
            url: me.url,
            logLevel: me.logLevel,
            maxConnections: me.maxConnections,
            autoBatch: me.autoBatch
        }, {});
    },

    /**
     * Disconnect from the server-side and stop the polling process. The disconnect
     * event will be fired on a successful disconnect.
     */
    disconnect: function() {
        var me = this;
        me.cometd.removeListener('/meta/handshake', Ext.bind(me._onHandshake, me));
        me.cometd.removeListener('/meta/connect', Ext.bind(me._onConnect, me));
        me.cometd.removeListener('/meta/disconnect', Ext.bind(me._onDisconnect, me));
        me.cometd.disconnect(false);
    },

    invoke: function(config) {
        var subscription, service = '/service/' + config.connectionType,
            serviceKey = config.serviceKey,
            me = this,
            widgetMetadataId = config.params.widgetMetadataId,
            serviceSpecificationId = config.params.serviceSpecificationId,
            o2uuid = Ext.data.IdGenerator.get('uuid').generate();

        if (config.connectionType === 'data/shared/listen' || config.connectionType === 'data/cache/get') {
            // this is an async data subscription creation, so we need to map the serviceKey for later
            if (!this.subscribedServiceKeys[serviceSpecificationId+'|'+widgetMetadataId]) {
                this.subscribedServiceKeys[serviceSpecificationId+'|'+widgetMetadataId] = serviceKey;
                subscription = me.cometd.addListener('/service/data/shared/listen', me, Ext.bind(function(sid, sk, m) {
                    if (m.message.indexOf(sid) !== -1) {
                        this.cometd.removeListener(subscription);
                        this._onData(sk, m);
                    }
                }, me, [serviceSpecificationId,serviceKey], 0));
                me.cometd.addListener('/service/data/cache/get', me, Ext.bind(me._onData, me, [serviceKey], 0));
            }
            if (config.connectionType === 'data/shared/listen') {
                Ext.Array.include(this.pendingSubscribedServiceKeys, serviceKey);
            }
        } else if (config.connectionType === 'data/transient/listen') {

            this.pendingSynchSubscriptions[serviceKey] = me.cometd.addListener(service, me, Ext.bind(function(sk, m) {
                if (this.pendingSynchSubscriptions[sk]) {
                    this.cometd.removeListener(this.pendingSynchSubscriptions[sk]);
                    delete this.pendingSynchSubscriptions[sk];
                }
                if (this.synchServiceKeys[m.data.routeId] && this.synchServiceKeys[m.data.routeId].routeId) {
                    o2e.connectorMgr.receiveData(sk, this.synchServiceKeys[m.data.routeId].payload);
                    delete this.synchServiceKeys[m.data.routeId];
                } else {
                    this.synchServiceKeys[m.data.routeId] = sk;
                }
            }, me, [serviceKey], 0));

        } else if (config.connectionType === 'data/private/listen') {
            subscription = me.cometd.addListener(service, me, Ext.bind(function(sk, o2id, m) {
                if (this.idMap[m.id] === o2id) {
                    this.privateRoutes[m.data.routeId] = sk;
                    this.cometd.removeListener(subscription);
                    delete this.idMap[m.id];
                    this._onData(sk, m);
                }
            }, me, [serviceKey, o2uuid], 0));
        } else {
            subscription = me.cometd.addListener(service, me, Ext.bind(function(sk, o2id, m) {
                if (this.idMap[m.id] === o2id) {
                    this.cometd.removeListener(subscription);
                    delete this.idMap[m.id];
                    this._onData(sk, m);
                }
            }, me, [serviceKey, o2uuid], 0));
        }
        me.cometd.publish(service, config.params, { o2uuid: o2uuid });
    },

    uninvoke: function(config) {
        var subscriber, service = '/service/' + config.connectionType,
            serviceKey = config.serviceKey,
            me = this,
            widgetMetadataId = config.params.widgetMetadataId,
            serviceSpecificationId = config.params.serviceSpecificationId;

        // this.cometd.removeListener(service, config.callback);
        if (config.connectionType === 'data/shared/listen') {
            me.cometd.publish('/service/data/shared/unlisten', config.params);
            for (subscriber in this.subscribedServiceKeys) {
                if (this.subscribedServiceKeys.hasOwnProperty(subscriber) &&
                    this.subscribedServiceKeys[subscriber] === serviceKey) {
                    delete this.subscribedServiceKeys[subscriber];
                }
            }
        } else if (config.connectionType === 'data/private/listen') {
            for (subscriber in this.privateRoutes) {
                if (this.privateRoutes.hasOwnProperty(subscriber) && this.privateRoutes[subscriber] === serviceKey) {
                    me.cometd.publish('/service/data/private/unlisten', { routeId: subscriber });
                    delete this.privateRoutes[subscriber];
                }
            }
        }
    },

    subscribe: function(channel, callback, scope) {
        this.subscribedChannels[channel] = { callback: callback, scope: scope };
        this.cometd.subscribe(channel, scope, callback);
    },
    
    unsubscribe: function(channel, scope, callback) {
        this.cometd.unsubscribe(channel, scope, callback);
        delete this.subscribedChannels[channel];
    },

    batch: function(config) {

    },

    //Private
    _onData: function(serviceKey, message) {
        var subscriber;
        try {
            //Determine if it's successful
            if (!message.error && message.channel !== '/service/data/shared/listen' && message.channel !== '/service/data/private/listen') {
                if (message.channel === '/service/data/cache/get') {
                    for (subscriber in this.subscribedServiceKeys) {
                        if (this.subscribedServiceKeys.hasOwnProperty(subscriber) &&
                            this.subscribedServiceKeys[subscriber] === serviceKey &&
                            message.message.indexOf(subscriber.split('|')[0]) === -1) {
                            // data/get response that does not match the serviceKey, so return.
                            return;
                        }
                    }
                }
                if (message.message.length > 0) {
                    o2e.connectorMgr.receiveStatus(
                        serviceKey,
                        String(message.statusCode) === '200' ?
                            o2e.data.DataUtils.serviceStatus.INFO : o2e.data.DataUtils.serviceStatus.ERROR,
                        message.message);
                }

                if (message.statusCode === 200) {
                    o2e.connectorMgr.receiveData(serviceKey, message.data, message.forceRefresh);
                } else {
                    o2e.connectorMgr.receiveFailure(serviceKey, message.message);
                }
            } else if (!message.error && (message.channel === '/service/data/shared/listen' || message.channel === '/service/data/private/listen')) {
                if (message.message.length > 0) {
                    o2e.connectorMgr.receiveStatus(
                        serviceKey,
                        String(message.statusCode) === '200' ?
                            o2e.data.DataUtils.serviceStatus.LOADING : o2e.data.DataUtils.serviceStatus.ERROR,
                        message.message);
                }
            } else {
                o2e.connectorMgr.receiveFailure(serviceKey, message.message);
            }
        } catch (e) {
            o2e.connectorMgr.receiveStatus(serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'Error occurred retrieving data. Please contact your administrator.');
            o2e.connectorMgr.receiveStatus(serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'Details: '+e.name+': ' +e.message+'\n\n'+e.stack);
            o2e.log.error('Error handling response, '+e.name+': ' +e.message+'\n\n'+e.stack, false, e);
        }
    },

    //private
    _onHandshake: function(message) {
        var subscriber, privateRoute, channel, keys;
        if (message.successful) {
            //console.info('/meta/handshake', 'Successful handshake');

            /*
             * Leaving this here as a lesson learned. If new handshake, no need to unsubscribe -- not subscribed anyway!
             *
            if (this.subscribedClientId) {
                this.cometd.unsubscribe('/data/'+this.subscribedClientId);
            }
            */

            this.subscribedClientId = message.clientId;

            //Notify user of successful handshake (probably will want to simply log this)
            this.cometd.subscribe('/data/'+message.clientId, this, function(d) {
                var serviceKey, pending;
                // XMPP handler first
                if (d.message === 'XMPP Message') {
                    this.handleXmppData(d);
                }
                // private routes (persistent or transient) data handler
                else if (d.data.routeId) {
                    if (this.privateRoutes[d.data.routeId]) {
                        o2e.connectorMgr.receiveData(this.privateRoutes[d.data.routeId], d.data.payload, true);
                    } else if (typeof this.synchServiceKeys[d.data.routeId] === 'string') {
                        o2e.connectorMgr.receiveData(this.synchServiceKeys[d.data.routeId], d.data.payload, true);
                        delete this.synchServiceKeys[d.data.routeId];
                    } else {
                        // race condition handling here... store the data
                        this.synchServiceKeys[d.data.routeId] = d.data;
                    }
                }
                // userauth handler
                else if (d.data.username) {
                    // Authentication event from post-handshake logic
                    this.fireEvent('userauth', d.data);
                }
                // async data handler
                else if (d.data.payload && d.data.payload.dataAvailable) {
                    // Async data available notification
                    // Use serviceKey hash from payload and invoke the /data/get API
                    serviceKey = this.subscribedServiceKeys[d.data.serviceSpecificationId+'|'+d.data.widgetMetadataId];
                    pending = Ext.Array.contains(this.pendingSubscribedServiceKeys, serviceKey);
                    // only call data/get if we have a pending sub or if the data is stale (hashcode is new)
                    if (serviceKey && serviceKey !== '' &&
                        (pending || this.dataHashMap[d.data.serviceSpecificationId+'|'+d.data.widgetMetadataId] !== d.data.payload.hashcode)
                        ) {
                        if (pending) {
                            Ext.Array.remove(this.pendingSubscribedServiceKeys, serviceKey);
                        }
                        this.dataHashMap[d.data.serviceSpecificationId+'|'+d.data.widgetMetadataId] = d.data.payload.hashcode;
                        this.invoke({
                            connectionType: 'data/cache/get',
                            serviceKey: serviceKey,
                            params: {
                                widgetMetadataId: d.data.widgetMetadataId,
                                serviceSpecificationId: d.data.serviceSpecificationId
                            }
                        });
                    }
                }
                // direct data handler
                else if (d.data.serviceSpecificationId && d.data.widgetMetadataId) {
                    serviceKey = this.subscribedServiceKeys[d.data.serviceSpecificationId+'|'+d.data.widgetMetadataId];
                    this.buffers[serviceKey] = this.buffers[serviceKey] || Ext.create('o2e.util.DataBuffer', { serviceKey: serviceKey, metadata: o2e.serviceRegistry.registry.get(d.data.widgetMetadataId) });
                    this.buffers[serviceKey].add(d.data.payload);
                    this.buffers[serviceKey].dump();
                    //Ext.Function.defer(o2e.connectorMgr.receiveData, 50, o2e.connectorMgr, [serviceKey, d.data.payload, false], false);
                }
                // else, pass to generic notify
                else if (o2e.env.notifyMgr) {
                    o2e.env.notifyMgr.notify(d);
                }
            });

            // Rescue subscriptions
            for (subscriber in this.subscribedServiceKeys) {
                if (this.subscribedServiceKeys.hasOwnProperty(subscriber)) {
                    o2e.log.debug('Rescuing subscription for '+subscriber);
                    keys = subscriber.split('|');
                    this.cometd.publish('/service/data/shared/listen', { serviceSpecificationId: keys[0], widgetMetadataId: keys[1] });
                }
            }

            for (privateRoute in this.privateRoutes) {
                if (this.privateRoutes.hasOwnProperty(privateRoute)) {
                    o2e.log.debug('Rescuing private subscription for '+ this.privateRoutes[privateRoute]);
                    keys = this.privateRoutes[privateRoute].split('|');
                    this.cometd.publish('/service/data/private/listen', { serviceSpecificationId: keys[0], widgetMetadataId: keys[1] });
                }
            }

            for (channel in this.subscribedChannels) {
                if (this.subscribedChannels.hasOwnProperty(channel)) {
                    o2e.log.debug('Rescuing subscription for '+subscriber);
                    this.cometd.subscribe(channel, this.subscribedChannels[channel].scope, this.subscribedChannels[channel].callback);
                }
            }
        }
        else {
            Ext.Msg.show({
               title:'Handshake failure',
               msg: 'Comet Server handshake failed: ' + message.ext.authStatus.message,
               buttons: Ext.Msg.OK,
               fn: function(btn) {
                   window.location.href = this.redirectUrl;
               }
            });
        }
    },

    //private
    _onConnect: function(message) {
        var wasConnected, me = this;
        
        if (this.cometd.isDisconnected()) {
            return;
        }
        
        wasConnected = this.connected;
        this.connected = message.successful;
        
        if (!wasConnected) {
            if (me.connected) {
                //console.info('/meta/connect', 'Connected to Comet Server');
                me.fireEvent('connect', true);
            }
            else {
                //console.info('/meta/connect', 'Failed to connect to Comet Server');
                me.fireEvent('connect', false);
            }
        }
        else {
            if (me.connected) {
                //console.info('/meta/connect', 'Reconnected to Comet Server');
                me.fireEvent('reconnect', true);
            }
            else {
                //console.info('/meta/connect', 'Failed to reconnect to Comet Server');
                me.fireEvent('reconnect', false);
            }
        }
    },
    
    //private
    _onDisconnect: function(message) {
        //if (message.successful) {
            //console.info('/meta/disconnect', 'Disconnected from Comet Server');
        //}
        //else {
            //console.warn('/meta/disconnect', 'Failed to disconnect from Comet Server');
        //}
        this.connected = !message.successful;
        this.fireEvent('disconnect', message.successful);
    },

    xmppInvoke: function(action, payload, onSuccess, onError, scope) {
        // validation first
        if (!action || action === '') {
            throw "You must provide an action to invoke the XMPP service.";
        }

        var service = '/service/xmpp/'+action;
        if (onSuccess) {
            this.cometd.addListener(service, this, Ext.bind(this.handleXmppData, this, [onSuccess, onError, scope], 1));
        }
        this.cometd.publish(service, payload);
    },

    handleXmppData: function(data, success, failure, scope) {
        if (data.statusCode === 200) {
            if (success) {
                success.call(scope, data);
            } else {
                o2e.env.xmppMgr.receivePacket(data);
            }
        } else if (failure) {
            failure.call(scope, data);
        }
    }

    /**
     * @cfg url
     */
    /**
     * @cfg logLevel
     */
    /**
     * @cfg maxConnections
     */
    /**
     * @cfg maxNetworkDelay
     */
    /**
     * @cfg autoBatch
     */
    /**
     * @cfg allowWebSocket
     */
    /**
     * @cfg allowCrossDomain
     */
    /**
     * @cfg redirectUrl
     */
});