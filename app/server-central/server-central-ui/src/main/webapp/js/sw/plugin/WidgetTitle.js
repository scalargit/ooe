Ext.define('sw.plugin.WidgetTitle', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'widgetTitle',

    init: function() {},

    createItem: function() {
        return Ext.create('Ext.menu.Item', {
            iconCls: 'icon-edit',
            text: 'Rename Widget',
            handler: function() {
                Ext.Msg.prompt('Rename Widget', 'Please enter a new name for this widget', function(id, txt) {
                    this.widget.widgetCt.setTitle(txt);
                }, this, false, this.widget.widgetCt.title)
            },
            scope: this
        });
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});