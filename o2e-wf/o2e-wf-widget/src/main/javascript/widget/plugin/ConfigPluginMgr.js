/**
 * @class o2e.plugin.ConfigPluginMgr
 * @singleton
 */
Ext.define('o2e.plugin.ConfigPluginMgr', {

    singleton: true,

	/**
	 *
	 */
	plugins: {},
    widgetLinks: {},

	/**
	 *
	 * @param {Object} plugin
	 */
	reg: function(plugin) {
        var i, len, wType, pluginId = plugin.prototype.pluginId;

        this.plugins[pluginId] = plugin;

        wType = plugin.prototype.widgetType;

        if (wType) {
            if (Ext.isArray(wType)) {
                for (i=0, len=wType.length; i<len; i++) {
                    if (!this.widgetLinks[wType[i]]) {
                        this.widgetLinks[wType[i]] = [];
                    }
                    this.widgetLinks[wType[i]].push(pluginId);
                }
            } else {
                if (!this.widgetLinks[wType]) {
                    this.widgetLinks[wType] = [];
                }
                this.widgetLinks[wType].push(pluginId);
            }
        }

	},

	/**
	 *
	 * @param {String} pluginId
     * @param {Object} cfg
	 */
	create: function(pluginId, cfg) {
        if (this.plugins.hasOwnProperty(pluginId)) {
		    cfg.itemId = pluginId;
		    return new this.plugins[pluginId](cfg);
        }
        return null;
	},

    /**
     * Find for config plugins is inclusive. We want all that are available.
     *
     * @param {String} widgetType
     */
    find: function(widgetType) {
        return this.widgetLinks[widgetType] || [];
    }

});
