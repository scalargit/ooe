Ext.define('sw.plugin.ManageServices', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'manageServices',

    item: null,
    text: 'Manage Services',
    iconCls: 'icon-manage',
    defaultItemClass: 'Ext.menu.Item',
    disabled: true,

    init: function() {
        this.widget.on('serviceadd', this.onServiceAdd, this);
        this.widget.on('serviceremove', this.onServiceRemove, this);
    },

    onServiceAdd: function(widgetId, serviceKey) {
        var service = this.widget.services[serviceKey];
        this.itemRef.menu.add(Ext.create('Ext.menu.CheckItem', {
            text: service.metadata.name,
            serviceKey: serviceKey,
            checked: service.active,
            menu: [{
                iconCls: 'icon-cancel',
                text: 'Remove',
                serviceKey: serviceKey,
                handler: function(item) {
                    // Do this here because of race conditions
                    this.itemRef.menu.hide();
                    this.widget.removeService(item.serviceKey);
                },
                scope: this
            }],
            listeners: {
                checkchange: this.onCheck,
                scope: this
            }
        }));
        this.itemRef.enable();
    },

    onServiceRemove: function(widgetId, serviceKey) {
        this.itemRef.menu.items.each(function(item) {
            if (item.serviceKey === serviceKey) {
                this.itemRef.menu.remove(item);
            }
        }, this);
        if (this.itemRef.menu.items.getCount() === 0) {
            this.itemRef.disable();
        }
    },

    createItem: function(itemClass) {
        var menuItems = [], serviceKey, service;

        for (serviceKey in this.widget.services) {
            if (this.widget.services.hasOwnProperty(serviceKey)) {
                this.disabled = false;
                service = this.widget.services[serviceKey];

                // create the menu item config
                menuItems.push({
                    xtype: 'menucheckitem',
                    text: service.metadata.name,
                    serviceKey: serviceKey,
                    checked: service.active,
                    menu: [{
                        iconCls: 'icon-cancel',
                        text: 'Remove',
                        serviceKey: serviceKey,
                        handler: function(item) {
                            // Do this because of race conditions
                            this.itemRef.menu.hide();
                            this.widget.removeService(item.serviceKey);
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

        return this.itemRef;
    },

    onCheck: function(item, checked) {
        this.widget.setServiceActive(item.serviceKey, checked);
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});