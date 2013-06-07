Ext.define('sw.alerts.ConfigPlugin', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'alerts',
    widgetType: ['rss', 'detail', 'gmap', 'grid', 'area', 'scatter', 'bar', 'line', 'pie', 'gauge', 'timeline', 'html', 'tpl', 'ginhand'],

    item: null,
    iconCls: 'icon-alerts',
    text: 'Alert All',
    defaultItemClass: 'Ext.menu.CheckItem',

    init: function() {
        this.widget.on('serviceadd', this.onServiceAdd, this);
        this.widget.on('serviceremove', this.onServiceRemove, this);
    },

    onServiceAdd: function(widgetId, serviceKey) {
        var found = false, service = this.widget.services[serviceKey], menu = this.itemRef.menu;
        menu.items.each(function(i) {
            if (i.serviceKey === serviceKey) {
                found = true;
                return false;
            }
            return true;
        });
        if (!found) {
            menu.add(Ext.create('Ext.menu.CheckItem', {
                text: service.metadata.name,
                serviceKey: serviceKey,
                checked: service.alertActive === true,
                listeners: {
                    checkchange: this.onCheck,
                    scope: this
                }
            }));
        }
    },

    onServiceRemove: function(widgetId, serviceKey) {
        var menu = this.itemRef.menu;
        menu.items.each(function(i) {
            if (i.serviceKey === serviceKey) {
                menu.remove(i);
                return false;
            }
        });
    },

    createItem: function(itemClass) {
        var menuItems = [], services = this.widget.services, serviceKey, service;

        for (serviceKey in services) {
            if (services.hasOwnProperty(serviceKey)) {
                service = services[serviceKey];
                menuItems.push({
                    xtype: 'menucheckitem',
                    text: service.metadata.name,
                    serviceKey: serviceKey,
                    checked: service.alertActive === true,
                    listeners: {
                        checkchange: this.onCheck,
                        scope: this
                    }
                })
            }
        }

        this.itemRef = Ext.create(itemClass || this.defaultItemClass, {
            iconCls: this.iconCls,
            text: this.text,
            itemId: this.pluginId,
            disabled: this.disabled,
            menu: menuItems,
            listeners: {
                checkchange: this.onCheck,
                scope: this
            }
        });

        return this.itemRef;
    },

    onCheck: function(item, checked) {
        var services = this.widget.services, serviceKey, service;

        if (item.text === 'Alert All') {
            for (serviceKey in services) {
                if (services.hasOwnProperty(serviceKey)) {
                    services[serviceKey].alertActive = checked;
                }
            }
            item.menu.items.each(function(cb) {
                cb.setChecked(checked);
            });
        } else {
            services[item.serviceKey].alertActive = checked;
        }
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});