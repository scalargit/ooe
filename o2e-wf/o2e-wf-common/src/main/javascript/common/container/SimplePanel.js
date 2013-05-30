Ext.define('o2e.container.SimplePanel', {

    extend: 'Ext.panel.Panel',
    alias: 'widget.o2e-simplepanel',

    mixins: {
        container: 'o2e.widget.AbstractContainer'
    },

    closable: true,
    collapsible: false,

    border: 0,

    desiredPlugins: [],//'classificationBadge', 'clearBtn', 'refreshBtn', 'lockBtn', 'serviceStatus'],

    constructor: function(cfg) {
        cfg.layout = 'fit';
        this.callParent([cfg]);
        this.configPlugins = {};
    }
//    constructor: function(cfg) {
//        var bbarCfg, plugins = this.plugins;
//
//        this.buildDesiredPlugins();
//        this.buildWidgetPlugins();
//
//        bbarCfg = {
//            items: [
//                plugins.classificationBadge.getItem(),
//                '->',
//                plugins.clearBtn.getItem(),
//                plugins.refreshBtn.getItem(),
//                plugins.lockBtn.getItem(),
//                plugins.serviceStatus.getItem()
//            ]
//        };
//
//        cfg.bbar = new Ext.Toolbar(bbarCfg);
//
//        this.callParent([cfg]);
//    }

});