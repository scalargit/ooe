Ext.define('sw.quickpanel.Services', {
    extend: 'o2e.widget.MetadataRegistryCategoryTreePanel',
    alias: 'widget.servicetree',

    emptyText: 'No services available. Click Start to begin.',
    ddGroup: 'services',
    searchFields: ['tags'],
    refreshQuery: {
        serviceId: 'SYSTEM_widget_list',
        params: {
            query: {
                pageSize: "10000",
                pageNumber: "0"
            }
        }
    },

    handler: function(pk) {
        o2e.app.viewport.getComponent('mainContentPanel').addWidgetFromService(pk, null);
    },

    onItemContextMenu: function(v, r, i, idx, e) {
        e.preventDefault();
        if (!r.get('leaf')) {
            return;
        }

        var menu, vizType, widgetType, items = [], params = {}, serviceKey, dQuery = {}, m = { data: r.get('metadata') };

        Ext.each(m.data.request, function(reqCol) {
            params[reqCol.name] = reqCol.defaultValue;
        });

        serviceKey = o2e.connectorMgr.getServiceKey(m.data._id, params);
        dQuery['json.tabs.items.widgets.services.' + serviceKey + '.serviceId'] = m.data._id;

        for (vizType in m.data.viz) {
            if (m.data.viz.hasOwnProperty(vizType)) {
                widgetType = o2e.widgetTypeRegistry.registry.get(vizType);
                items.push({
                    text: 'Open in ' + widgetType.properName,
                    icon: widgetType.icon,
                    vizType: vizType,
                    handler: function(item) {
                        o2e.app.viewport.getComponent('mainContentPanel').addWidgetFromService(m.data._id, item.vizType);
                    }
                })
            }
        }

        items.push('-');

        items.push({
            text: 'Add to Favorites',
            iconCls: 'icon-favorites',
            handler: function() {
                o2e.app.addFavorite({ favoriteName: m.data.name, favoriteId: m.data._id, favoriteType: 'Services' });
            }
        }, {
            text: 'Get Embed URL',
            iconCls: 'icon-wiring',
            handler: function() {
                var url = window.location.protocol + '//' + window.location.host + window.location.pathname + '?embed=true&hideToolbar=true&hideTitleBar=true&widget=' + m.data._id;
                Ext.Msg.prompt('Widget Embed URL', 'Please copy/paste the URL below', Ext.emptyFn, this, false, url);
            }
        }, {
            text: 'Dependent UDOPs',
            iconCls: 'icon-pagekey',
            menu: {
                items: [
                    {text: 'No dependent UDOPs found.'}
                ],
                listeners: {
                    show: {
                        fn: function(menu) {
                            menu.getEl().mask('Please wait...');
                            o2e.app.queryUdopDependencies(dQuery, function(data) {
                                if (data.records.length) {
                                    menu.removeAll();
                                    for (var x = 0,xlen = data.records.length; x < xlen; x++) {
                                        menu.add({
                                            text: data.records[x].record.json.udopTitle,
                                            udopId: data.records[x].record.uuid
                                        });
                                    }
                                    menu.getEl().unmask();
                                } else {
                                    menu.getEl().unmask();
                                }
                            });
                        },
                        scope: this
                    }
                }
            }
        });

        items.push({
            text: 'Edit Service',
            iconCls: 'icon-edit',
            handler: function() {
                var console = Ext.create('sw.admin.Console', { initTab: 0 });
                console.show();
                console.loadMetadata(m.data);
            }
        }, {
            text: 'Rename Service',
            iconCls: 'icon-service-edit',
            handler: function() {
                var newSvc = Ext.clone(m.data);
                Ext.Msg.prompt('Rename Service', 'Please enter a new name for this service.', function(id, txt) {
                    txt = Ext.String.trim(txt);
                    if ((id === 'yes' || id === 'ok') && txt !== newSvc.name) {
                        newSvc.name = txt;
                        o2e.serviceRegistry.update(newSvc._id, newSvc, function(d) {
                            Ext.Msg.hide();
                            o2e.env.notifyMgr.send('service', {action: 'update', metadata: d});
                        }, this);
                    }
                }, this, false, newSvc.name);
            }
        }, {
            text: 'Duplicate Service',
            iconCls: 'icon-pagecopy',
            handler: function() {
                var newSvc = Ext.clone(m.data),
                    x = 0, xlen = newSvc.request.length, serviceSpec;
                delete newSvc._id;
                delete newSvc.id;
                delete newSvc.creator;
                delete newSvc.createdTime;
                delete newSvc.lastUpdatedBy;
                delete newSvc.lastUpdatedTime;

                for (; x < xlen; x++) {
                    if (newSvc.request[x].name === 'serviceSpecificationId') {
                        serviceSpec = newSvc.request[x].defaultValue;
                        break;
                    }
                }

                Ext.Msg.prompt('Duplicate Service', 'Please enter a new name for this service.', function(id, txt) {
                    if (id === 'yes' || id === 'ok') {
                        newSvc.name = txt;

                        // First, update the service spec.
                        o2e.connectorMgr.query({
                            componentId: 'quickpanel',
                            serviceId: 'SYSTEM_service_get',
                            serviceKey: 'AdminConsole|getServiceSpec|' + serviceSpec,
                            params: { id: serviceSpec },
                            success: function(sk, data) {
                                var newSvcSpec = Ext.clone(data);
                                delete newSvcSpec._id;
                                newSvcSpec.name = txt;

                                o2e.connectorMgr.query({
                                    componentId: 'quickpanel',
                                    connectionType: 'metadata',
                                    serviceId: 'SYSTEM_service_save',
                                    params: newSvcSpec,
                                    success: function (k, m) {
                                        newSvc.request = [
                                            { name: 'serviceSpecificationId', header: 'Service Specification ID', defaultValue: m._id }
                                        ];
                                        o2e.serviceRegistry.insert(null, newSvc, function(d) {
                                            d.request.push({ name: 'widgetMetadataId', header: 'Widget Metadata ID', defaultValue: d._id });
                                            o2e.serviceRegistry.update(d._id, d, function (md) {
                                                Ext.Msg.hide();
                                                o2e.env.notifyMgr.send('service', {action: 'add', metadata: md});
                                            }, this);
                                        }, this);
                                    },
                                    failure: this._onError,
                                    scope: this
                                });
                            },
                            failure: this._onError,
                            scope: this
                        });
                    }
                }, this, false, 'Copy of ' + newSvc.name);
            }
        }, {
            text: 'Remove Service',
            iconCls: 'icon-cancel',
            handler: function() {
                var data = m.data;
                o2e.app.queryUdopDependencies(dQuery, function(d) {
                    var notifyMeta = { "_id" : data._id };
                    if (d.records.length) {
                        Ext.Msg.alert('Error', 'Cannot remove service "' + data.name + '". Please check dependent UDOPs.');
                    } else {
                        o2e.serviceRegistry.remove(data._id);
                        o2e.env.notifyMgr.send('service', {action: 'remove', metadata: notifyMeta });
                        // TODO: remove the servicespec first
                    }
                });
            }
        });

        menu = Ext.menu.Manager.get({
            plain: true,
            items: items
        });

        menu.showAt(e.getX(), e.getY());
    }
});
