/**
 * @class o2e.plugin.AbstractDataPlugin
 * @extends o2e.plugin.AbstractPlugin
 *
 * Data plugins are not meant to persist any information. They are relatively stateless.
 *
 *
 *
 */
Ext.define('o2e.plugin.AbstractDataPlugin', {

    extend: 'o2e.plugin.AbstractPlugin',

    /**
     * @cfg {Mixed} widgetType Comma separated list of applicable widgets. Unlike in AbstractPlugin, putting '*' here
     * will throw an error because it is likely to not work for all widgets and could cause major breakdowns.
     */
    widgetType: null,
    /**
     * @cfg {Boolean} useRawData
     */
    useRawData: false,
    /**
     * @cfg {Array} requiredAnnotations Optional. Make this plugin applicable only to services that meet all of the
     * specified annotations. If requiredServices are specified, this is ignored.
     */
	requiredAnnotations: [],
    /**
     * @cfg {Array} optionalAnnotations
     */
    optionalAnnotations: [],
    /**
     * @cfg {Array} applicableServices Optional. Make this plugin applicable only to one or more particular services.
     */
	applicableServices: [],
    /**
     * @cfg {Boolean} restrictFields Set to true to limit the data model to only annotations.
     *
     * Note: This will only actually limit the fields in the data model if all plugins for the service restrict
     * them. So iterating over a dataset and presuming that only your annotations will be there is not an
     * acceptable approach.
     */
    restrictFields: true,

    //TODO: determine what to do about stores

    /**
     *
     * @param {Object} cfg
     */
    constructor: function(cfg) {
        var me = this;

        this.callParent(arguments);

        me.isCompatibleCache = {};
    },

    init: function() {
        // COMMENTING OUT FOR NOW -- SEE ABSTRACTDATACOMPONENT.RECEIVEDATA
//        if (!this.widget.useOwnStores) {
//            var insertCb, removeCb, serviceKey;
//
//            insertCb = function(store, records, serviceKey) {
//                this.onInsert(records, serviceKey);
//            };
//
//            removeCb = function(store, record, serviceKey) {
//                this.onRemove(record, serviceKey);
//            };
//
//            if (this.widget.unionData) {
//                this.widget.store.on('add', Ext.bind(insertCb, this, [null], 2), this);
//                this.widget.store.on('remove', Ext.bind(removeCb, this, [null], 2), this);
//            } else {
//                for (serviceKey in this.widget.services) {
//                    if (this.widget.services.hasOwnProperty(serviceKey)) {
//                        this.widget.stores[serviceKey].on('add', Ext.bind(insertCb, this, [serviceKey], 2), this);
//                        this.widget.stores[serviceKey].on('remove', Ext.bind(removeCb, this, [serviceKey], 2), this);
//                    }
//                }
//            }
//        }
    },

    /**
     *
     * @param {Object} serviceKey
     * @param {Object} metadata
     */
    isCompatible: function(serviceKey, metadata) {
        var i, len, serviceId = o2e.connectorMgr.getServiceId(serviceKey), found, j, jLen, annotations, me = this;

        if (me.isCompatibleCache[serviceId] !== undefined) {
            return me.isCompatibleCache[serviceId];
        }

        if (me.applicableServices !== null) {
            for (i=0, len=me.applicableServices.length; i<len; i++) {
                if (me.applicableServices[i] === serviceId) {
                    return true;
                }
            }
            return false;
        } else if (me.requiredAnnotations !== null) {
            for (i=0, len=metadata.response.length; i<len; i++) {
                found = false;
                annotations = metadata.response[i].annotations;
                for (j=0, jLen=annotations.length; j<jLen; j++) {
                    if (me.requiredAnnotations[i] === annotations[j]) {
                        found = true;
                    }
                }
                if (!found) {
                    return false;
                }
            }
        }
        return true;
    },

    clearIsCompatibleCache: function(serviceId) {
        if (serviceId !== undefined) {
            if (this.isCompatibleCache.hasOwnProperty(serviceId)) {
                delete this.isCompatibleCache[serviceId];
            }
        } else {
            this.isCompatibleCache = {};
        }
    },

    /**
     *
     * @param {Object} data
     * @param {String} serviceKey
     * @param {Object} metadata
     */
    handleData: function(data, serviceKey, metadata) {
        var me = this;

        if (data.clear) {
            me.clearData(serviceKey, metadata);
        }
        if (data.remove.length > 0) {
            me.removeData(data.remove, serviceKey, metadata);
        }
        if (data.add.length > 0) {
            me.addData(data.add, serviceKey, metadata);
        }
        if (data.update.length > 0) {
            me.updateData(data.update, serviceKey, metadata);
        }

        return true;
    },

    onInsert: function(records, serviceKey) {
        var metadata = serviceKey ? this.widget.services[serviceKey].metadata : {};
        this.handleData({
            add: records,
            update: [],
            remove: []
        }, serviceKey, metadata);
    },

    onRemove: function(record, serviceKey) {
        var metadata = serviceKey ? this.widget.services[serviceKey].metadata : {};
        this.handleData({
            add: [],
            update: [],
            remove: [record]
        }, serviceKey, metadata);
    },

    getStateConfig: function() {
        return {};
    },

    /**
     * @param {String} serviceKey
     */
    clearData: Ext.emptyFn,

    /**
     *
     * @param {Array} records
     * @param {String} serviceKey
     * @param {Object} metadata
     */
    removeData: Ext.emptyFn,

    /**
     *
     * @param {Array} records
     * @param {String} serviceKey
     * @param {Object} metadata
     */
    addData: Ext.emptyFn,

    /**
     *
     * @param {Array} records
     * @param {String} serviceKey
     * @param {Object} metadata
     */
    updateData: Ext.emptyFn

});