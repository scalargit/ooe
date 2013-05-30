Ext.define('o2e.connector.UngovernedConnector', {
    extend: 'o2e.connector.AbstractConnector',

    type: 'ungoverned',

    constructor : function(cfg) {
        Ext.apply(this, cfg);
    },

    invoke: function(cfg) {
        if (cfg.connectionType === 'HTML') {
            Ext.Function.defer(o2e.connectorMgr.receiveData, 100, o2e.connectorMgr, [cfg.serviceKey, {html:{info:{url: cfg.params.url}}}, false]);
        }
    },

    uninvoke: Ext.emptyFn
});