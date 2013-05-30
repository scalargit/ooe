Ext.define('o2e.container.FramedPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.o2e-framedpnlct',
    mixins: {
        container: 'o2e.widget.AbstractContainer'
    },

    layout: 'fit',
    frame: true,
    closable: true,
    collapsible: false,
    cls: 'framedpnlct',
    resizable: true,
    resizeHandles: 'se',

    desiredPlugins: [],

    constructor: function(cfg) {
        this.callParent([cfg]);
        this.configPlugins = {};
    }
});