Ext.define('sw.plugins.LaunchInOzone', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'launchInOzone',

    iconCls: 'icon-wiring',
    defaultItemClass: 'Ext.menu.Item',
    text: 'Create in Ozone',
    init: Ext.emptyFn,

    handleMenuItemClick: function(item, e) {
        if (!o2e.env.builderMode) {
            Ext.Msg.alert('Error', 'Ozone environment has not been initialized. Please contact your administrator.');
        }

        Ext.Msg.confirm('Generate URL', 'Create In Ozone?', function(btn) {
            
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
                        var url = window.location.protocol + '//' + window.location.host + window.location.pathname + '?embed=true&hideTitleBar=true&widi=' + data.uuid;
                        
                        var widgetName = this.widget.initialConfig.title;
						
						var wData = Ozone.util.toString({
								headerIcon:'/owf/images/blue/icons/widgetIcons/widget2.gif',
								image:'/owf/images/blue/icons/widgetIcons/widget2.gif',
								height: 800,
								width: 800,
								name: widgetName,
								tags: '',
								url: url,
								version: 1});
						
						
						o2e.app.widgetEventingController.publish('NewWidgetSW', wData);
						
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