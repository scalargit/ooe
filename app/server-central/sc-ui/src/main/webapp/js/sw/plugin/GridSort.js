Ext.define('sw.plugin.GridSort', {
    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'gridSort',
    widgetType: 'grid',

    init: function() {},

    createItem: function() {
        return Ext.create('Ext.menu.Item', {
            iconCls: 'icon-stop',
            text: 'Clear Sort',
            handler: function() {
                var widget = this.widget, store = widget.store;
                store.sorters.clear();
                store.data.sortBy(function(a,b) { return a.internalId > b.internalId; });
                store.fireEvent('datachanged', store);
                widget.grid.headerCt.clearOtherSortStates();
            },
            scope: this
        });
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});