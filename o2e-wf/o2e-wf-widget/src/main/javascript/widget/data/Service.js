/**
 * @class o2e.data.Service
 *
 * Simple object describing the state of a particular service in a widget. Exists only for API clarity.
 *
 * This information is persisted with the widget so no DOM objects should be put here. Nor should anything that
 * represents transient state information, like service status or classification. It must also not contain data
 * in order to comply with IA requirements.
 */
Ext.define('o2e.data.Service', {
    /**
     * @cfg {String} serviceId
     */
    serviceId: null,
    /**
     * @cfg {Object} params
     */
    params: null,
    /**
     * @cfg {Boolean} active
     */
    active: true,
    /**
     * @cfg {Array} filters
     */
    filters: null,
    /**
     * @cfg {Object} metadata
     */
    metadata: null,

    /**
     * @property plugins
     * @type Array
     */
    plugins: null,

    defaults: {
        params: {},
        active: true,
        filters: []
    },

    constructor: function(cfg) {
        Ext.apply(this, cfg, this.defaults);
    }
    /**
     * @property serviceId
     * @type String
     */
    /**
     * @property params
     * @type Object
     */
    /**
     * @property active
     * @type Boolean
     */
    /**
     * @property filters
     * @type Array
     */
    /**
     * @property metadata
     * @type Object
     */
});