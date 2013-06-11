Ext.define('sw.connector.FlowDataConnector', {
    extend: 'o2e.connector.AbstractConnector',

    type: 'flowdata',

    callbackKey: 'jsonp',
    disableCaching: true,
    disableCachingParam: '_',
    format: 'json',

    timeout: 30000,

    activeRequests: null,
    currentData: null,
    listenerCount: null,

    constructor : function(cfg) {
        Ext.apply(this, cfg);

        this.activeRequests = {};
        this.currentData = {};
        this.listenerCount = {};
    },

    invoke: function(cfg) {
        if (!this.activeRequests[cfg.serviceKey]) {
            var tgts = cfg.metadata.ext.targets.split(','), x=0, xlen=tgts.length, targets = [];

            for(;x<xlen;x++) {
                targets.push(cfg.metadata.ext.targetSystem + '.' + Ext.String.trim(tgts[x]) + '.' + cfg.metadata.ext.targetType);
            }

            this.activeRequests[cfg.serviceKey] = Ext.TaskManager.start({
                run: function() {
                    Ext.data.JsonP.request({
                        url: cfg.metadata.ext.url,
                        params: Ext.apply(cfg.params, {
                            format: this.format,
                            from: cfg.metadata.ext.from,
                            until: cfg.metadata.ext.until,
                            target: targets
                        }),
                        success: Ext.pass(this._onSuccess, [cfg.serviceKey], this),
                        failure: Ext.pass(this._onFailure, [cfg.serviceKey], this),
                        scope: this,
                        callbackKey: this.callbackKey,
                        disableCaching: cfg.metadata.ext.disableCaching || this.disableCaching,
                        disableCachingParam: cfg.metadata.ext.disableCachingParam || this.disableCachingParam,
                        timeout: cfg.metadata.ext.timeout || this.timeout
                    });
                },
                scope: this,
                interval: Number(cfg.metadata.ext.refreshInterval) * 1000 || 1000
            });
            this.listenerCount[cfg.serviceKey] = 1;
        } else if (this.currentData[cfg.serviceKey]) {
            o2e.connectorMgr.receiveData(cfg.serviceKey, this.currentData[cfg.serviceKey]);
            this.listenerCount[cfg.serviceKey] = this.listenerCount[cfg.serviceKey] + 1;
        }
    },

    uninvoke: function(cfg) {
        if (this.activeRequests[cfg.serviceKey]) {
            if (this.listenerCount[cfg.serviceKey] === 1){
                Ext.TaskManager.stop(this.activeRequests[cfg.serviceKey]);
                delete this.activeRequests[cfg.serviceKey];
                delete this.currentData[cfg.serviceKey];
                delete this.listenerCount[cfg.serviceKey];
            } else {
                this.listenerCount[cfg.serviceKey] = this.listener[cfg.serviceKey] - 1;
            }
        }
    },

    _onSuccess: function(serviceKey, data) {
        var resp = {flow:{ data: [] }},
            timestamps = {}, t,
            meta = o2e.serviceRegistry.registry.get(serviceKey.substring(0, serviceKey.indexOf('|'))),
            x=0, xlen=data.length;

        for (var target;x<xlen;x++) {
            target = data[x].target.substring(meta.ext.targetSystem.length + 1, data[x].target.length - meta.ext.targetType.length - 1);
            for (var timestamp,y=0,ylen=data[x].datapoints.length;y<ylen;y++) {
                timestamp = data[x].datapoints[y][1];
                if (!timestamps[timestamp]) {
                    timestamps[timestamp] = { time: Ext.Date.format(new Date(timestamp * 1000), 'H:i:s') };
                }
                timestamps[timestamp][target] = data[x].datapoints[y][0];
            }
        }

        for (t in timestamps) {
            if (timestamps.hasOwnProperty(t)) {
                resp.flow.data.push(timestamps[t]);
            }
        }

        this.currentData[serviceKey] = resp;

        o2e.connectorMgr.receiveData(serviceKey, resp);
    },

    _onFailure: function(serviceKey, data) {
        o2e.connectorMgr.receiveFailure(serviceKey, Ext.decode(data), false);
    }
});