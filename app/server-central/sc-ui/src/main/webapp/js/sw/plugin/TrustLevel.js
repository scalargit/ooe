Ext.define('sw.plugin.TrustLevel', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'trustLevel',

    item: null,
    text: 'Trust Level',
    iconCls: 'icon-manage',
    defaultItemClass: 'Ext.menu.Item',
    disabled: true,

    init: function() {
        this.widget.on('serviceadd', this.rollup, this);
        this.widget.on('serviceremove', this.rollup, this);
    },

    createItem: function() {
        this.rollup();
    },

    rollup: function() {
        var level = 3, serviceKey, service;
        for (serviceKey in this.widget.services) {
            service = this.widget.services[serviceKey].metadata;
            if (service.ext && service.ext.trust !== undefined && service.ext.trust !== null) {
                if (service.ext.trust < level) {
                    // lowest takes precedence
                    level = service.ext.trust;
                }
            } else {
                // unspecified so we have to assume the lowest trust level
                level = 1;
            }
        }
        this.widget.widgetCt.setIconCls('icon-trust'+level);
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});