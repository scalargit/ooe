Ext.define('o2e.plugin.RefreshButton', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    /**
     * @cfg iconCls
     */
    iconCls: 'icon-refresh',
    /**
     * @cfg text
     */
    text: '',
    /**
     * @cfg pluginId
     */
    pluginId: 'refresh',

    handleMenuItemClick: function(item, e) {
        this.widget.widgetCt.body.mask('Refreshing, please wait...');
        var services = this.widget.services, serviceKey;

        for (serviceKey in services) {
            if (services.hasOwnProperty(serviceKey)) {
                if (services[serviceKey].metadata.append) {
                    this.widget.clearData(serviceKey);
                } else {
                    o2e.connectorMgr.query({
                        componentId: this.widget.id,
                        serviceId: services[serviceKey].serviceId,
                        params: services[serviceKey].params,
                        metadata: services[serviceKey].metadata,
                        success: Ext.emptyFn,
                        failure: Ext.emptyFn,
                        scope: this
                    });
                }
            }
        }
        this.widget.widgetCt.body.unmask();
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});