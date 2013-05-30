Ext.define('o2e.plugin.DataPluginSelector', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    /**
     *
     * @param pluginId
     * @param {String} serviceKey Optional. If not provided applies to all applicable services.
     */
    addDataPlugin: function(pluginId, serviceKey) {
        //TODO: is the plugin compatible? Does it remove something else from the chain?

        var plugin = o2e.plugins.DataPluginMgr.create(pluginId, { context: this });
        this.dataPlugins.push(plugin);
        plugin.init();

        //Create the plugin

        //Bind it to the applicable services

        //Rebuild models for effected services

        //Reprocess data for effected services

    },

    /**
     *
     * @param pluginId
     */
    removeDataPlugin: function(pluginId) {
        var i, len, plugin;
        for (i=0, len=this.dataPlugins.length; i<len; i++) {
            if (this.dataPlugins[i].id === pluginId) {
                plugin = this.dataPlugins.splice(i, 1)[0];
                plugin.destroy();
            }
        }

        //Unbind the plugin from all services to which it is currently bound

        //Destroy the plugin

        //Rebuild models for effected services

        //Reprocess data for effected services

    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});