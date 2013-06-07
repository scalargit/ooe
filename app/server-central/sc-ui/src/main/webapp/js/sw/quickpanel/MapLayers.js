Ext.define('sw.quickpanel.MapLayers', {
    extend: 'o2e.widget.MetadataRegistryCategoryTreePanel',
    alias: 'widget.maplayerstree',

    emptyText: 'No map layers found.',
    ddGroup: 'gmapKml',
    searchFields: ['tags', 'url'],
    refreshQuery: {
        serviceId: 'SYSTEM_collection_list',
        params: {
            pageSize: '10000',
            pageNumber: '0',
            collection: 'kml'
        }
    },

    handler: function(pk, metadata) {
        var widgetMeta = { services: {}, widgetCt: { title: metadata.name, configPlugins: { gmapKml: { layers: {}}}}};
        widgetMeta.widgetCt.configPlugins.gmapKml.layers[metadata['uuid']] = { name: metadata.name, url: metadata.url, active: true };
        o2e.app.viewport.getComponent('mainContentPanel').addWidget('gmap', widgetMeta);
    },

    onItemContextMenu: function(v, r, i, idx, e) {
        e.preventDefault();
        if (!r.get('leaf')) {
            return;
        }

        var menu, vizType, items = [], dQuery = {}, m = { data: r.get('metadata') };

        dQuery['json.tabs.items.widgets.widgetCt.configPlugins.gmapKml.layers.'+m.data.uuid+'.name'] = m.data.name;

        items.push({
            text: 'Add to Favorites',
            iconCls: 'icon-favorites',
            handler: function() {
                o2e.app.addFavorite({ favoriteName: m.data.name, favoriteId: m.data.uuid, favoriteType: 'Map Layers' });
            }
        },{
            text: 'Dependent UDOPs',
            iconCls: 'icon-pagekey',
            menu: {
                items: [{text: 'No dependent UDOPs found.'}],
                listeners: {
                    show: {
                        fn: function(menu) {
                            menu.getEl().mask('Please wait...');
                            o2e.app.queryUdopDependencies(dQuery, function(data) {
                                if (data.records.length) {
                                    menu.removeAll();
                                    for (var x=0,xlen=data.records.length; x<xlen; x++) {
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
            text: 'Edit Map Layer',
            iconCls: 'icon-edit',
            handler: function() {
                var console = Ext.create('sw.admin.Console', { initTab: 1 });
                console.show();
                console.loadMetadata(m.data);
            }
        },{
            text: 'Rename Map Layer',
            iconCls: 'icon-maplayer-edit',
            handler: function() {
                var newLayer = Ext.clone(m.data);
                Ext.Msg.prompt('Rename Map Layer', 'Please enter a new name for this map layer.', function(id, txt) {
                    txt = Ext.String.trim(txt);
                    if ((id === 'yes' || id === 'ok') && txt !== newLayer.name) {
                        newLayer.name = txt;
                        o2e.kmlRegistry.update(newLayer.uuid, newLayer, function(d) {
                            Ext.Msg.hide();
                            o2e.env.notifyMgr.send('mapLayer', {action: 'update', metadata: d});
                        }, this);
                    }
                }, this, false, newLayer.name);
            }
        },{
            text: 'Duplicate Map Layer',
            iconCls: 'icon-pagecopy',
            handler: function() {
                var newLayer = Ext.clone(m.data);
                delete newLayer.uuid;
                Ext.Msg.prompt('Duplicate Map Layer', 'Please enter a new name for this map layer.', function(id, txt) {
                    if (id === 'yes' || id === 'ok') {
                        newLayer.name = txt;
                        o2e.kmlRegistry.insert(null, newLayer, function(d) {
                            Ext.Msg.hide();
                            o2e.env.notifyMgr.send('mapLayer', {action: 'add', metadata: d});
                        }, this);
                    }
                }, this, false, 'Copy of '+newLayer.name);
            }
        },{
            text: 'Remove Map Layer',
            iconCls: 'icon-cancel',
            handler: function() {
                var data = m.data;
                o2e.app.queryUdopDependencies(dQuery, function(d) {
                    var notifyMeta = { "_id" : data._id };
                    if (d.records.length) {
                        Ext.Msg.alert('Error', 'Cannot remove map layer "'+data.name+'". Please check dependent UDOPs.');
                    } else {
                        o2e.kmlRegistry.remove(data.uuid);
                        o2e.env.notifyMgr.send('mapLayer', {action: 'remove', metadata: notifyMeta });
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