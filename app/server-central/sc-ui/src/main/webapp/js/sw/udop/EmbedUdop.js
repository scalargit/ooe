Ext.define('sw.udop.EmbedUdop', {
    extend: 'Ext.panel.Panel',
    layout: {
        type: 'card',
        deferredRender: true
    },
    alias: ['widget.sw-udop'],
    border: 0,

    constructor: function(cfg) {
        this.callParent(arguments);
    },

    initComponent: function() {
        Ext.apply(this, {
            defaults: {
                xtype: 'portalpanel',
                closable: false,
                padding: 0,
                border: 0,
                bodyBorder: 0
            },
            bbar: [{
                text: 'Back',
                handler: function() {
                    this.getLayout().prev();
                },
                scope: this
            },{
                text: 'Forward',
                handler: function() {
                    this.getLayout().next();
                },
                scope: this
            }]
        });

        this.callParent();
    },

    getActiveTab: function() {
        return this.getLayout().getActiveItem();
    },

    getWidgets: function() {
        var x, xlen, y, ylen, col, widgets = [], tab = this.getActiveTab();
        for (x=0,xlen=tab.items.getCount();x<xlen;x++) {
            col = tab.items.getAt(x);
            for (y=0,ylen=col.items.getCount();y<ylen;y++) {
                widgets = widgets.concat(col.items.getAt(y).items.items);
            }
        }
        return widgets;
    }
});