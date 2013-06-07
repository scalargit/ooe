Ext.define('sw.plugin.DetailSort', {
    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'detailSort',
    widgetType: 'detail',

    init: function() {},

    createItem: function() {
        return Ext.create('Ext.menu.Item', {
            iconCls: 'icon-stop',
            text: 'Clear Sort',
            handler: function() {
                var widget = this.widget,
                    tab = widget.tabPanel.getActiveTab(),
                    store = tab.store;
                store.sorters.clear();
                tab.headerCt.clearOtherSortStates();
                store.setSource(tab.getSource());
                delete widget.dwSortState;
                widget.dwSortState = null;
            },
            scope: this
        });
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});