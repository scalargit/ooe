Ext.define('sw.plugins.GenerateEmbedLink', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'embedUrl',

    iconCls: 'icon-wiring',
    defaultItemClass: 'Ext.menu.Item',
    text: 'Generate URL',

    init: Ext.emptyFn,

    handleMenuItemClick: function(item, e) {
        Ext.Msg.confirm('Generate URL', 'Are you sure you want to generate a URL for this widget?', function(btn) {
            if (btn === 'yes' || btn === 'ok') {
                this.widget.body.mask('Generating URL, please wait...');
                o2e.connectorMgr.query({
                    componentId: this.id,
                    serviceId: 'SYSTEM_collection_save',
                    params: {
                        collection: 'widgetinstance',
                        json: this.widget.getStateConfig()
                    },
                    success: function(serviceKey, data, forceRefresh) {
                        var url = window.location.protocol + '//' + window.location.host + window.location.pathname + '?embed=true&hideToolbar=true&hideTitleBar=true&widi=' + data.uuid;
                        Ext.Msg.prompt('Widget Embed URL', 'Please copy/paste the URL below', Ext.emptyFn, this, false, url);
                        this.widget.body.unmask();
                    },
                    failure: this._onError,
                    scope: this
                });
            }
        }, this);
    },

    getStateConfig: function() {
        return this.callParent();
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});