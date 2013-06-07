Ext.define('sw.status.ConfigPlugin', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'status',

    iconCls: 'sw-status-loading',

    status: null,
    store: null,
    statusHistory: 25,
    dataViewActive: false,

    init: function() {
        var serviceKey, service;
        this.status = o2e.data.DataUtils.serviceStatus.LOADING;
        this.summaryStore = Ext.create('sw.status.SummaryStore');
        for (serviceKey in this.widget.services) {
            if (this.widget.services.hasOwnProperty(serviceKey)) {
                service = this.widget.services[serviceKey];
                if (this.summaryStore.findExact('service', service.metadata.name || serviceKey) === -1) {
                    this.summaryStore.add({
                        service: service.metadata.name || serviceKey,
                        iconCls: service.metadata.ext && !Ext.isEmpty(service.metadata.ext.trust) ? 'icon-trust'+service.metadata.ext.trust : 'icon-trust1',
                        statusCls: this.getStatusCls(o2e.data.DataUtils.serviceStatus.INFO),
                        message: 'No messages received.',
                        lastError: 'No errors have occurred.',
                        filtered: 0,
                        total: 0,
                        timestamp: Ext.util.Format.date(new Date(), "Y-m-d H:i:s")
                    });
                }
            }
        }
        this.store = Ext.create('sw.status.Store');
        this.widget.on('servicestatus', this.updateStatus, this);
        this.widget.on('serviceadd', this.addService, this);
        this.widget.on('serviceremove', this.removeService, this);
    },

    addService: function(widgetId, serviceKey) {
        var service = this.widget.services[serviceKey];
        if (this.summaryStore.getAt(this.summaryStore.findExact('service', service.metadata.name)) === undefined) {
            this.summaryStore.add({
                service: service.metadata.name || serviceKey,
                iconCls: service.metadata.ext && !Ext.isEmpty(service.metadata.ext.trust) ? 'icon-trust'+service.metadata.ext.trust : 'icon-trust1',
                statusCls: this.getStatusCls(o2e.data.DataUtils.serviceStatus.INFO),
                message: 'No messages received.',
                lastError: 'No errors have occurred.',
                filtered: 0,
                total: 0,
                timestamp: Ext.util.Format.date(new Date(), "Y-m-d H:i:s")
            });
        }
    },

    removeService: function(widgetId, serviceKey) {
        var service = this.widget.services[serviceKey] ? this.widget.services[serviceKey].metadata.name : serviceKey,
            storeIdx = this.store.findExact('service', service);
        this.summaryStore.removeAt(this.summaryStore.findExact('service', service));
        while (storeIdx !== -1) {
            this.store.removeAt(storeIdx);
            storeIdx = this.store.findExact('service', service);
        }
    },

    checkStatusIcon: function(status) {
        if (this.itemRef && (status > this.status || status === o2e.data.DataUtils.serviceStatus.LOADING)) {
            this.status = status;
            this.itemRef.setIconCls(this.getStatusCls(status));
        }
    },

    updateStatus: function(serviceKey, status, message) {
        var service = this.widget.services[serviceKey] ? this.widget.services[serviceKey].metadata.name : null,
            metadata = this.widget.services[serviceKey] ? this.widget.services[serviceKey].metadata : {},
            summaryRecord = this.summaryStore.getAt(this.summaryStore.findExact('service', service)),
            newSummary = {
                statusCls: this.getStatusCls(status),
                message: message,
                timestamp: Ext.util.Format.date(new Date(), "Y-m-d H:i:s")
            };

        if (service !== null) {
            if (summaryRecord === undefined) {
                summaryRecord = this.summaryStore.add({
                    service: service,
                    iconCls: metadata.ext && !Ext.isEmpty(metadata.ext.trust) ? 'icon-trust'+metadata.ext.trust : 'icon-trust1',
                    statusCls: this.getStatusCls(o2e.data.DataUtils.serviceStatus.INFO),
                    message: 'No messages received.',
                    lastError: 'No errors have occurred.',
                    filtered: 0,
                    total: 0,
                    timestamp: Ext.util.Format.date(new Date(), "Y-m-d H:i:s")
                })[0];
            }

            if (status === o2e.data.DataUtils.serviceStatus.ERROR) {
                newSummary.lastError = message;
            } else if (status !== o2e.data.DataUtils.serviceStatus.LOADING && summaryRecord.get('lastError') !== 'No errors have occurred.') {
                newSummary.statusCls = this.getStatusCls(o2e.data.DataUtils.serviceStatus.ERROR);
            }

            if (message.indexOf('Filtered') === 0) {
                newSummary.filtered = Number(message.substring(9,message.indexOf('of')));
                if (isNaN(newSummary.filtered)) {
                    newSummary.filtered = summaryRecord.get('filtered');
                }
            }

            if (message.indexOf('Filters removed') === 0) {
                newSummary.filtered = 0;
            }

            if (message.indexOf('Total Records:' === 0)) {
                newSummary.total = Number(message.substr(14));
                if (isNaN(newSummary.total)) {
                    newSummary.total = summaryRecord.get('total');
                }
            }

            summaryRecord.set(newSummary);
            summaryRecord.commit();
        }

        if (this.store.getCount() >= this.statusHistory) {
            this.store.removeAt(0);
        }

        this.store.loadData([{
            service: service || serviceKey,
            statusCls: this.getStatusCls(status),
            message: message
        }], true);

        this.checkStatusIcon(status);
    },

    getStatusCls: function(status) {
        var constants = o2e.data.DataUtils.serviceStatus;
        switch(status) {
            case constants.INFO: return 'sw-status-info';
            case constants.WARN: return 'sw-status-warn';
            case constants.ERROR: return 'sw-status-error';
            case constants.LOADING: return 'sw-status-loading';
        }
    },

    getPanel: function(item) {
        return Ext.create('sw.status.DataPanel', {
            itemId: item.itemId,
            store: this.store,
            summaryStore: this.summaryStore,
            listeners: {
                clear: {
                    fn: function() {
                        this.summaryStore.each(function(r) {
                            r.set({
                                statusCls: this.getStatusCls(o2e.data.DataUtils.serviceStatus.INFO),
                                message: 'No messages received.',
                                lastError: 'No errors have occurred.',
                                timestamp: Ext.util.Format.date(new Date(), "Y-m-d H:i:s")
                            });
                            r.commit();
                        }, this);
                        this.store.removeAll();
                    },
                    scope: this
                },
                close: {
                    fn: this.handlePanelClose,
                    scope: this
                }
            }
        });
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});