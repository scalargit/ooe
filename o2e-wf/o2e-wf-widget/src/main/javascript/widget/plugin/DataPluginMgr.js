/**
 * @class o2e.plugin.DataPluginMgr
 * @singleton
 */
Ext.define('o2e.plugin.DataPluginMgr', {

    singleton: true,

	plugins: {},

    widgetIndependent: [],
    dataIndependent: [],
    universal: [],

    widgetLinks: {},
    serviceLinks: {},
	
	/**
	 *
	 * @param {Object} plugin
	 */
	reg: function(plugin) {
        var i, len, serviceId, me = this, pluginProto = plugin.prototype,
            pluginId = pluginProto.pluginId,
            widgetType = pluginProto.widgetType,
            applicableServices = pluginProto.applicableServices,
            widgetIndependent = (widgetType === '*'),
            dataIndependent = (pluginProto.dataIndependent === true);

        me.plugins[pluginId] = plugin;

        if (widgetIndependent) {
            me.widgetIndependent.push(pluginId);
        } else {
            if (me.widgetLinks.hasOwnProperty(widgetType)) {
                me.widgetLinks[widgetType].push(pluginId);
            } else {
                me.widgetLinks[widgetType] = [pluginId];
            }
        }

        if (applicableServices !== null) {
            for (i=0, len=applicableServices.length; i<len; i++) {
                serviceId = applicableServices[i];
                if (me.serviceLinks.hasOwnProperty(serviceId)) {
                    me.serviceLinks[serviceId].push(pluginId);
                } else {
                    me.serviceLinks[serviceId] = [pluginId];
                }
            }
        } else if (dataIndependent) {
            this.dataIndependent.push(pluginId);

            if (widgetIndependent) {
                this.universal.push(pluginId);
            }
        }
	},
	
	/**
	 * 
	 * @param {String} pluginId
     * @return Returns a DataPlugin reference.
	 */
	create: function(pluginId, cfg) {
		return new this.plugins[pluginId](cfg);
	},

    /**
     * Get all plugins applicable for the given service and widget.
     *
     * @param serviceId
     * @param widgetType
     * @param metadata
     * @return Returns an array of plugin IDs
     */
    find: function(serviceId, widgetType, metadata) {
        var services = this.findByService(serviceId, widgetType),
            annotations = this.findByAnnotations(serviceId, widgetType, metadata);

        return Ext.Array.unique(this.universal.concat(services, annotations));
    },

    findByService: function(serviceId, widgetType) {
        var serviceMatches, widgetMatches, sIdx, sLen, wIdx, wLen;

        serviceMatches = this.findByServiceId(serviceId);
        widgetMatches = this.findByWidgetType(widgetType);
        for (sIdx=0, sLen=serviceMatches.length; sIdx<sLen; sIdx++) {
            for (wIdx=0, wLen=widgetMatches.length; wIdx<wLen; wIdx++) {
                if (serviceMatches[sIdx] === widgetMatches[wIdx]) {
                    return widgetMatches[wIdx];
                }
            }
        }

        return [];
    },

    findByAnnotations: function(serviceId, widgetType, metadata) {
        var rIdx, rLen, rsp = metadata.response, sAnnotations = [], wMatches, wIdx, wLen, pAnnotations;

        for (rIdx=0, rLen=rsp.length; rIdx<rLen; rIdx++) {
            sAnnotations = sAnnotations.concat(rsp[rIdx].annotations);
        }

        wMatches = this.findByWidgetType(widgetType);
        for (wIdx=0, wLen=wMatches.length; wIdx<wLen; wIdx++) {
            pAnnotations = this.plugins[wMatches[wIdx]].prototype.requiredAnnotations;
            if (Ext.Array.difference(pAnnotations, sAnnotations).length > 0) {
                wMatches.splice(wIdx, 1);
                wIdx--;
                wLen--;
            }
        }

        return wMatches;
    },

    /**
     *
     * @param {String} widgetType
     */
    findByWidgetType: function(widgetType) {
        return this.widgetIndependent.concat(this.widgetLinks[widgetType] || []);
    },

    /**
     *
     * @param {String} serviceId
     */
    findByServiceId: function(serviceId) {
        return this.serviceLinks[serviceId] || [];
    }
	
});
