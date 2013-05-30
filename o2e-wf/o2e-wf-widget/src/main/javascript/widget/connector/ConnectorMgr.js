/**
 * @class o2e.connector.ConnectorMgr
 * @singleton
 */
Ext.define('o2e.connector.ConnectorMgr', {

    singleton: true,

    /**
     * @property connectors
     * @type Object
     */
	connectors: null,

    /**
     * @property subscribers
     * @type Object
     */
	subscribers: null,

    /**
     * @property callbacks
     * @type Object
     */
    callbacks: null,

    /**
     * @property cache
     * @type Object
     * Cache of data responses so that all widgets subscribed to the same serviceKey can show the
     * same data regardless of when they were opened. This is deferred until post 1.0 release so
     * will simply be null for now.
     */
	cache: null,

    /**
     *
     * @param cfg
     */
	constructor: function(cfg) {
		Ext.apply(this, cfg);
		this.cache = {};
		this.connectors = [];
		this.subscribers = {};
        this.callbacks = {};
	},

    /**
     *
     * @param type
     * @param connector
     */
    reg: function(type, connector) {
		if (this.connectors.hasOwnProperty(type)) {
			o2e.log.warn("Duplicate connector being registered. This will override the original "+type+" connector.");
		}
        this.connectors[type] = connector;
    },

    /**
     *
     * @param serviceId
     * @param params
     */
	getServiceKey: function(serviceId, params) {
        var key = [serviceId], pName;
        if (params !== null) {
            for (pName in params) {
                if (params.hasOwnProperty(pName)) {
                    if (typeof params[pName] === 'string') {
                        key.push(params[pName].replace(/\./g, '_'));
                    } else {
                        key.push(params[pName]);
                    }
                }
            }
        }
        return key.join("|");
	},

    /**
     *
     * @param serviceKey
     */
	getServiceId: function(serviceKey) {
		var firstPipe = serviceKey.indexOf('|');
        if (firstPipe !== -1) {
            return serviceKey.substring(0, firstPipe);
        } else {
            return serviceKey;
        }
	},

    /**
     *
     * @param cfg
     */
	query: function(cfg) {
        if (!cfg.serviceKey) {
            cfg.serviceKey = this.getServiceKey(cfg.serviceId, cfg.params);
        }
		if (!this.callbacks.hasOwnProperty(cfg.serviceKey)) {
            this.callbacks[cfg.serviceKey] = [];
        }
        this.callbacks[cfg.serviceKey].push({
            id: cfg.componentId,
            success: cfg.success,
            failure: cfg.failure,
            scope: cfg.scope
        });

        if (cfg.metadata) {
            if (!this.doSubscribe(cfg)) {
                this.removeCallback(cfg.serviceKey, cfg.componentId);
            }
        } else {
            o2e.serviceRegistry.get(cfg.serviceId, function(metadata) {
                cfg.metadata = metadata;
                if (!this.doSubscribe(cfg)) {
                    this.removeCallback(cfg.serviceKey, cfg.componentId);
                }
            }, this);
        }
	},

    batchQuery: function(cfgs) {

    },

    /**
     *
     * @param cfg
     */
	subscribe: function(cfg) {
        if (!this.subscribers.hasOwnProperty(cfg.serviceKey)) {
            this.subscribers[cfg.serviceKey] = [];
        }
        this.subscribers[cfg.serviceKey].push({
            id: cfg.componentId,
            success: cfg.success,
            status: cfg.status,
            failure: cfg.failure,
            scope: cfg.scope
        });

        if (cfg.metadata) {
            if (!this.doSubscribe(cfg)) {
                this.removeSubscription(cfg.serviceKey, cfg.componentId);
            }
        } else {
            o2e.serviceRegistry.get(cfg.serviceId, function(metadata) {
                cfg.metadata = metadata;
                if (!this.doSubscribe(cfg)) {
                    this.removeSubscription(cfg.serviceKey, cfg.componentId);
                }
            }, this);
        }

	},

    /**
     *
     * @param cfg
     */
	unsubscribe: function(cfg) {
        if (this.removeSubscription(cfg.serviceKey, cfg.componentId)) {
            if (this.subscribers.hasOwnProperty(cfg.serviceKey) && this.subscribers[cfg.serviceKey].length === 0) {
                if (cfg.metadata) {
                    this.doUnsubscribe(cfg);
                } else {
                    o2e.serviceRegistry.get(cfg.serviceId, function(metadata) {
                        cfg.metadata = metadata;
                        this.doUnsubscribe(cfg);
                    }, this);
                }
                return true;
            }
        }
        return false;
	},

    /**
     *
     * @param serviceKey
     * @param data
     * @param forceRefresh
     */
	receiveData: function(serviceKey, data, forceRefresh) {
        var subscribers, i, len, subscriber, callbacks, callback, me = this;

	    if (me.subscribers.hasOwnProperty(serviceKey)) {
            subscribers = me.subscribers[serviceKey];
            for (i=0, len=subscribers.length; i<len; i++) {
                subscriber = subscribers[i];
                subscriber.success.call(subscriber.scope || me, serviceKey, data, forceRefresh);
            }
        }

        if (me.callbacks.hasOwnProperty(serviceKey)) {
            callbacks = me.callbacks[serviceKey];
            for (i=0, len=callbacks.length; i<len; i++) {
                callback = callbacks[i];
                callback.success.call(callback.scope || me, serviceKey, data, forceRefresh);
            }
            delete me.callbacks[serviceKey];
        }
	},

    /**
     *
     * @param serviceKey
     * @param statusCode
     * @param status
     */
	receiveStatus: function(serviceKey, statusCode, status) {
		var subscribers, i, len, subscriber, me = this;
	    if (me.subscribers.hasOwnProperty(serviceKey)) {
            subscribers = me.subscribers[serviceKey];
            for (i=0, len=subscribers.length; i<len; i++) {
                subscriber = subscribers[i];
                subscriber.status.call(subscriber.scope || me, serviceKey, statusCode, status);
            }
        }
	},

    /**
     *
     * @param serviceKey
     * @param errorMsg
     */
	receiveFailure: function(serviceKey, errorMsg) {
        var subscribers, i, len, subscriber, callbacks, callback, me = this;

	    if (me.subscribers.hasOwnProperty(serviceKey)) {
            subscribers = me.subscribers[serviceKey];
            for (i=0, len=subscribers.length; i<len; i++) {
                subscriber = subscribers[i];
                subscriber.failure.call(subscriber.scope || me, serviceKey, errorMsg);
            }
        }

        if (me.callbacks.hasOwnProperty(serviceKey)) {
            callbacks = me.callbacks[serviceKey];
            for (i=0, len=callbacks.length; i<len; i++) {
                callback = callbacks[i];
                if (callback.failure) {
                    callback.failure.call(callback.scope || me, serviceKey, errorMsg);
                }
            }
            delete me.callbacks[serviceKey];
        }
	},

    //Private
    doSubscribe: function(cfg) {
        var connector, action;
        connector = cfg.metadata.clientConnector;
        action = cfg.metadata.connectorAction;

        if (this.connectors.hasOwnProperty(connector)) {
            this.connectors[connector][action]({
                serviceKey: cfg.serviceKey,
                connectionType: cfg.metadata.connectionType,
                serviceId: cfg.serviceId,
                params: cfg.params,
                metadata: cfg.metadata
            });
            return true;
        } else {
            o2e.log.error("Invalid metadata. Connector "+connector+" does not exist.");
            return false;
        }
    },

    //Private
    doUnsubscribe: function(cfg) {
        var connector, action;
        connector = cfg.metadata.clientConnector;
        action = cfg.metadata.connectorAction;

        if (this.connectors.hasOwnProperty(connector)) {
            this.connectors[connector]["un"+action]({
                serviceKey: cfg.serviceKey,
                connectionType: cfg.metadata.connectionType,
                serviceId: cfg.serviceId,
                params: cfg.params
            });
            return true;
        } else {
            o2e.log.error("Invalid metadata. Connector "+connector+" does not exist.");
            return false;
        }
    },

    //Private
    removeCallback: function(serviceKey, id) {
        var i, len, callbacks, callback;

        if (this.callbacks.hasOwnProperty(serviceKey)) {
            callbacks = this.callbacks[serviceKey];
            for (i=0, len=callbacks.length; i<len; i++) {
                callback = callbacks[i];
                if (callback.id === id) {
                    callbacks.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    },

    //Private
    removeSubscription: function(serviceKey, id) {
        var i, len, subscribers, subscriber;

        if (this.subscribers.hasOwnProperty(serviceKey)) {
            subscribers = this.subscribers[serviceKey];
            for (i=0, len=subscribers.length; i<len; i++) {
                subscriber = subscribers[i];
                if (subscriber.id === id) {
                    subscribers.splice(i, 1);
                    return true;
                }
            }
        }
        return false;
    }
	
});
