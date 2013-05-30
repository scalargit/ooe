Ext.define('o2e.connector.JsonPConnector', {
    extend: 'o2e.connector.AbstractConnector',

    type: 'jsonp',

    disableCaching: true,
    disableCachingParam: '_dc',
    timeout: 30000,

    activeRequests: null,

    constructor : function(cfg) {
        Ext.apply(this, cfg);

        this.activeRequests = {};
    },

    invoke: function(cfg) {

        if (!this.activeRequests[cfg.serviceKey]) {
            this.activeRequests[cfg.serviceKey] = Ext.data.JsonP.request({
                url: cfg.metadata.url,
                params: cfg.params,
                success: Ext.pass(this._onSuccess, [cfg.serviceKey], this),
                failure: Ext.pass(this._onFailure, [cfg.serviceKey], this),
                scope: this,
                disableCaching: cfg.metadata.disableCaching || this.disableCaching,
                disableCacheParam: cfg.metadata.disableCachingParam || this.disableCachingParam,
                timeout: cfg.metadata.timeout || this.timeout
            });
        }
    },

    uninvoke: function(cfg) {
        if (this.activeRequests[cfg.serviceKey]) {
            Ext.data.JsonP.abort(this.activeRequests[cfg.serviceKey]);
            delete this.activeRequests[cfg.serviceKey];
        }
    },

    _onSuccess: function(serviceKey, data) {
        o2e.connectorMgr.receiveFailure(serviceKey, Ext.decode(data));
    },

    _onFailure: function(serviceKey, data) {
        o2e.connectorMgr.receiveData(serviceKey, Ext.decode(data), false);
    }
});