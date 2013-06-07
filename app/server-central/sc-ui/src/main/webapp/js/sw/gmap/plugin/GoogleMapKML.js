Ext.define('sw.gmap.plugin.GoogleMapKML', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'gmapKml',
    widgetType: 'gmap',

    item: null,
    text: 'KML Layers',
    iconCls: 'icon-kml',
    defaultItemClass: 'Ext.menu.Item',
    disabled: true,

    init: function() {
        var ct = this.widget.widgetCt;

        // Initialize state objects here
        this.layers = this.layers || {};

        // Custom logic -- need to add dropzone to this.widget.widgetCt
        ct.dropTargetDDGroups.push(this.pluginId);
        if (ct.dropTarget) {
            ct.dropTarget.addToGroup(this.pluginId);
        }
    },

    createItem: function(itemClass) {
        var menuItems = [], layer, curr, gmapLayer, mapToUse;

        for (layer in this.layers) {
            if (this.layers.hasOwnProperty(layer)) {
                this.disabled = false;
                curr = this.layers[layer];
                mapToUse = curr.active ? this.widget.gmap : null;

                // first, put active layers on the map
                gmapLayer = new google.maps.KmlLayer(curr.url, { map: mapToUse, preserveViewport: true });
                if (!this.widget.gmap) {
                    this.widget.on('ready', function() {
                        gmapLayer.setMap(this.widget.gmap);
                    }, this, { single: true });
                }

                // then create the menu item config
                menuItems.push({
                    xtype: 'menucheckitem',
                    text: curr.name,
                    layer: gmapLayer,
                    layerId: layer,
                    checked: curr.active,
                    menu: [{
                        iconCls: 'icon-cancel',
                        text: 'Remove',
                        handler: function(item) {
                            var menu = item.ownerCt, rootMenu = this.itemRef.menu;
                            rootMenu.hide();
                            rootMenu.items.each(function(i) {
                                if (i.menu === menu) {
                                    i.layer.setMap(null);
                                    delete this.layers[i.layerId];
                                    rootMenu.remove(i);
                                    if (rootMenu.items.getCount() === 0) {
                                        this.itemRef.disable();
                                    }
                                }
                            }, this);
                        },
                        scope: this
                    }],
                    listeners: {
                        checkchange: this.onCheck,
                        scope: this
                    }
                });
            }
        }

        this.itemRef = Ext.create(itemClass || this.defaultItemClass, {
            iconCls: this.iconCls,
            text: this.text,
            itemId: this.pluginId,
            disabled: this.disabled,
            menu: menuItems
        });

        this.widget.fireEvent('servicestatus', 'Plugins', o2e.data.DataUtils.serviceStatus.INFO, 'KML Plugin Initialized.');

        return this.itemRef;
    },

    onCheck: function(item, checked) {
        if (checked && item.layer.getMap() === null) {
            item.layer.setMap(this.widget.gmap);
            this.layers[item.layerId].active = true;
        } else {
            item.layer.setMap(null);
            this.layers[item.layerId].active = false;
        }
    },

    onContainerDrop: function(ddSource, e, data) {
         // Reference the record (single selection) for readability
        var r = ddSource.dragData.records[0].get('metadata');
        this.itemRef.enable();
        this.itemRef.menu.add(Ext.create('Ext.menu.CheckItem', {
            text: r.name,
            layer: new google.maps.KmlLayer(r.url, { map: this.widget.gmap, preserveViewport: true }),
            layerId: r.uuid,
            checked: true,
            menu: [{
                iconCls: 'icon-cancel',
                text: 'Remove',
                handler: function(item) {
                    var menu = item.ownerCt, rootMenu = this.itemRef.menu;
                    rootMenu.hide();
                    rootMenu.items.each(function(i) {
                        if (i.menu === menu) {
                            i.layer.setMap(null);
                            delete this.layers[i.layerId];
                            rootMenu.remove(i);
                            if (rootMenu.items.getCount() === 0) {
                                this.itemRef.disable();
                            }
                        }
                    }, this);
                },
                scope: this
            }],
            listeners: {
                checkchange: this.onCheck,
                scope: this
            }
        }));
        this.layers[r.uuid] = { name: r.name, url: r.url, active: true };
    },

    getStateConfig: function() {
        return Ext.apply({
            layers: this.layers
        }, this.callParent());
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});