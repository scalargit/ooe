Ext.define('sw.bootstrap.EmbedBootstrapEnvironment', {
    extend: 'o2e.Environment',

    constructor: function (cfg) {
        Ext.MessageBox.wait('Loading widget...', 'Please wait', {interval: 500, increment: 10});

        this.callParent([cfg]);

        if (this.messagingDeliveryEndpoint) {
            this.messagingDeliveryEndpoint = window.location.protocol + '//' + window.location.host + '/' + this.o2eServerContext + this.messagingDeliveryEndpoint;
        }

        o2e.connectorMgr.reg('ungoverned', Ext.create('o2e.connector.UngovernedConnector', {}));
        this.connector.on('userauth', function (authData) {
            this.username = authData.username;
            this.notifyMgr = Ext.create('sw.notify.NotifyManager', { connector: this.connector });
        }, this);

        this.on('load', function () {
            o2e.serviceRegistry.load(meta.system.services);
            if (o2e.env.widget !== '') {
                o2e.connectorMgr.query({
                    componentId: this.id,
                    serviceId: 'SYSTEM_widget_get',
                    params: {
                        id: o2e.env.widget
                    },
                    success: function (serviceKey, data, forceRefresh) {
                        o2e.serviceRegistry.load([data]);
                        o2e.widgetFactory.createFromService(data._id, o2e.env.widgetType === '' ? data.type : o2e.env.widgetType, 'sw-embedwidgetcontainer', o2e.app.viewport.add, o2e.app.viewport);
                        Ext.MessageBox.hide();
                    },
                    failure: this._onError,
                    scope: o2e.serviceRegistry
                });
            } else if (o2e.env.widgetInstance !== '') {
                o2e.connectorMgr.query({
                    componentId: this.id,
                    serviceId: 'SYSTEM_collection_get',
                    params: {
                        uuid: o2e.env.widgetInstance,
                        collection: 'widgetinstance'
                    },
                    success: function (serviceKey, data, forceRefresh) {
                        var service, widget = data.json;
                        widget.widgetCt.height = o2e.app.viewport.getHeight();
                        widget.widgetCt.heightRatio = 1;
                        for (service in widget.services) {
                            if (widget.services.hasOwnProperty(service)) {
                                o2e.serviceRegistry.get(service.substring(0, service.indexOf('|')), Ext.emptyFn);
                                if (Ext.Array.indexOf(widget.services[service].plugins, 'windowTitleAlert') !== -1) {
                                    Ext.Array.remove(widget.services[service].plugins, 'windowTitleAlert');
                                }
                            }
                        }
                        o2e.widgetFactory.create(widget.widgetTypeId, widget, 'sw-embedwidgetcontainer', null, o2e.app.viewport.add, o2e.app.viewport);
                        Ext.MessageBox.hide();
                    },
                    failure: this._onError,
                    scope: o2e.serviceRegistry
                });
            } else if (o2e.env.udop !== '') {
                o2e.connectorMgr.query({
                    componentId: this.id,
                    serviceId: 'SYSTEM_collection_get',
                    params: {
                        uuid: o2e.env.udop,
                        collection: 'udop'
                    },
                    success: function (serviceKey, data, forceRefresh) {
                        var services = [], cfg = data.json;
                        for (var tab, x = 0, xlen = cfg.tabs.length; x < xlen; x++) {
                            tab = cfg.tabs[x];
                            tab.rollup = Ext.create('sw.capco.Rollup');
                            for (var col, y = 0, ylen = tab.items.length; y < ylen; y++) {
                                col = tab.items[y];
                                for (var widget, service, z = 0, zlen = col.widgets.length; z < zlen; z++) {
                                    widget = col.widgets[z];
                                    widget.widgetCt.xtype = 'sw-embedwidgetcontainer';
                                    widget.widgetCt.cls = 'x-portlet';
                                    for (service in widget.services) {
                                        if (widget.services.hasOwnProperty(service)) {
                                            services.push(service.substring(0, service.indexOf('|')));
                                            if (Ext.Array.indexOf(widget.services[service].plugins, 'windowTitleAlert') !== -1) {
                                                Ext.Array.remove(widget.services[service].plugins, 'windowTitleAlert');
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        var udop = o2e.app.viewport.add({
                            xtype: 'sw-udop',
                            udopTitle: cfg.udopTitle,
                            items: cfg.tabs,
                            uuid: cfg.uuid,
                            public: cfg.public
                        });
                        udop.getLayout().setActiveItem(cfg.activeTab || 0);
                        Ext.MessageBox.hide();
                    },
                    failure: this._onError,
                    scope: this
                });
            }
        }, this);

        //o2e.profileRegistry.load(o2e.mock.metadata.profiles);
        o2e.widgetTypeRegistry.load(meta.system.widgetTypes);
    },

    useFirebug: true,
    application: 'sw.EmbedApplication'

}, function () {
    sw.embedEnvCls = Ext.getClassName(this);
});