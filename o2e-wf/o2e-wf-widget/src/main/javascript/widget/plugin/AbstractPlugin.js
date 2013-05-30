/**
 * @class o2e.plugin.AbstractPlugin
 * @extends Ext.util.Observable
 *
 * Enter lengthy explanation of plugins and what they can do here...
 * Plugins can be of two types.
 * Data Processors - either service specific or annotation driven.
 * Configuration Options - can be widget or service specific, but often applicable to all widgets.
 */
Ext.define('o2e.plugin.AbstractPlugin', {

    extend: 'Ext.util.Observable',

    /**
     * @cfg {o2e.widgets.AbstractWidget} widget Required.
     * 
     */ 
	widget: null,
    /**
     * @cfg {String} pluginId Required. Must be unique.
     */
    pluginId: '',

    /**
     * @cfg {Mixed} widgetType. Defaults to '' meaning all widgets. Make comma separated list of applicable widget
     * types to restrict to particular widgets.
     */
    widgetType: '',

    /**
     *
     * @param {Object} cfg
     */
    constructor: function(cfg) {
        Ext.apply(this, cfg);

        this.addEvents(
            /**
             * @event status
             * Fires on status changes (when data has been processed - successfully or otherwise)
             * @param {String} serviceKey
             * @param {String} pluginId
             * @param {Number} statusCode The status result
             * @param {String} message The corresponding message to be displayed as the status
             */
            'status'
        );
    },

    init: Ext.emptyFn,

    destroy: Ext.emptyFn,

    getStateConfig: function() {
        return {};
    }

});
