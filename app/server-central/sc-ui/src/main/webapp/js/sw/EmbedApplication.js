Ext.define('sw.EmbedApplication', {
    viewport: null,

    constructor: function(cfg) {
        this.viewport = Ext.create('Ext.Viewport', {
            layout: 'fit',
            items: []
        });
    }
});