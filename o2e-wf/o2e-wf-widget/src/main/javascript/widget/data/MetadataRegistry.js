/**
 * @class o2e.data.MetadataRegistry
 * @extends Ext.util.Observable
 */
Ext.define('o2e.data.MetadataRegistry', {

    extend: 'Ext.util.Observable',
    requires: ['Ext.util.MixedCollection'],

    /**
     * @cfg {String} type Required. A unique name for this registry, e.g. service, udop.
     */
    type: null,
    /**
     * @cfg {Boolean} isRemote Whether to get/insert/update/remove from a remote source. Defaults to true.
     */
    isRemote: true,
    /**
     * @cfg {String} getService Optional. The serviceId to use in get requests.
     */
    getService: null,
    /**
     * @cfg {String} insertService Optional. The serviceId to use in insert requests.
     */
    insertService: null,
    /**
     * @cfg {String} updateService Optional. The serviceId to use in update requests.
     */
    updateService: null,
    /**
     * @cfg {String} insertService Optional. The serviceId to use in insert requests.
     */
    removeService: null,
    /**
     * @cfg {String} primaryKey The field name to use for IDs in all requests. Defaults to 'id'.
     */
    primaryKey: 'id',
    /**
     * @cfg {String} insertKey Optional. The field name to use in insert requests.
     */
    insertKey: null,
    /**
     * @cfg {String} updateKey Optional. The field name to use in update requests.
     */
    updateKey: null,
    /**
     * @cfg {String} removeKey Optional. The field name to use in remove requests.
     */
    removeKey: null,
    /**
     * @cfg {Object} defaultParams Optional. The default parameter structure to use for requests. Commonly used with insertKey, updateKey and removeKey.
     */
    defaultParams: null,

    /**
     * @property id
     * @type String
     * Read only. The unique identifier for this registry.
     */
    id: null,

    /**
     * @constructor
     * @param {Object} cfg
     */
    constructor: function(cfg) {
        var me = this;

        Ext.apply(me, cfg);

        me.id = me.type+"MetadataRegistry";
        me.registry = new Ext.util.MixedCollection();

        me.addEvents(
                /**
                 * @event insert Fired on successful insert
                 * @param {Object} metadata
                 */
                'insert',
                /**
                 * @event update Fired on successful update
                 * @param {Object} metadata
                 */
                'update',
                /**
                 * @event remove Fired on successful remove
                 * @param {String} id
                 */
                'remove',
                /**
                 * @event load Fired on metadata load
                 * @param {Object[]} metadata
                 */
                'load'
        );
    },

    /**
     *
     * @param {Object} metadata
     */
    load: function(metadata) {
        var i, len;

        if (Ext.isArray(metadata)) {
            for (i=0, len=metadata.length; i<len; i++) {
                this.add(metadata[i]);
            }
            this.fireEvent('load', metadata);
        } else {
            this.add(metadata);
            this.fireEvent('load', [metadata]);
        }
    },

    /**
	 * @param {String} id
	 * @param {Function} callback
	 * @param {Object} scope
	 */
	get: function(id, callback, scope) {
        var me = this, params = me.defaultParams ? Ext.clone(me.defaultParams) : {};

		if (!me.registry.containsKey(id)) {
            params[me.primaryKey] = id;

            if (me.isRemote) {
                me.doRequest(me.getService, params, function(sKey, md) {
                    if (me.insertKey) {
                        var m = md[me.insertKey];
                        if (!m[me.primaryKey]) {
                            m[me.primaryKey] = md[me.primaryKey];
                        }
                        me.add(md[me.insertKey]);
                    } else {
                        me.add(md);
                    }
                    if (callback) {
                        callback.call(scope || me, md);
                    }
                });
            } else {
                o2e.log.warn("No metadata found for id "+id, false, id);
                if (callback) {
                    callback.call(scope || me, {});
                }
            }
        } else {
			callback.call(scope || me, me.registry.get(id));
        }
	},

    /**
	 * @param {String} id
     * @param {Object} metadata
	 * @param {Function} callback
	 * @param {Object} scope
	 */
    insert: function(id, metadata, callback, scope, forceLocal) {
		var me = this, params = me.defaultParams ? Ext.clone(me.defaultParams) : {}, fn;

        if (me.insertKey) {
            params[me.primaryKey] = id;
            params[me.insertKey] = metadata;
        } else {
            params = metadata;
        }

        fn = function(sKey, md) {
            var m = md;
            if (me.insertKey) {
                m = md[me.insertKey];
                if (!m[me.primaryKey]) {
                    m[me.primaryKey] = md[me.primaryKey];
                }
            }

            me.add(m);
            me.fireEvent('insert', m);
            if (callback) {
                callback.call(scope || me, m);
            }
        };

        if (me.isRemote && forceLocal !== true) {
            me.doRequest(me.insertService, params, fn);
        } else {
            fn.call(me, null, params);
        }
    },

    /**
	 * @param {String} id
     * @param {Object} metadata
	 * @param {Function} callback
	 * @param {Object} scope
	 */
    update: function(id, metadata, callback, scope, forceLocal) {
		var me = this, params = me.defaultParams ? Ext.clone(me.defaultParams) : {}, fn;

        if (me.updateKey) {
            params[me.primaryKey] = id;
            params[me.updateKey] = metadata;
        } else {
            params = metadata;
        }

        fn = function(sKey, md) {
            var m = md;
            if (me.updateKey) {
                m = md[me.updateKey];
                if (!m[me.primaryKey]) {
                    m[me.primaryKey] = md[me.primaryKey];
                }
            }

            me.add(m);
            me.fireEvent('update', m);
            if (callback) {
                callback.call(scope || me, m);
            }
        };

        if (me.isRemote && forceLocal !== true) {
            me.doRequest(me.updateService, params, fn);
        } else {
            fn.call(me, null, params);
        }
    },

    /**
	 * @param {String} id
	 * @param {Function} callback
	 * @param {Object} scope
	 */
    remove: function(id, callback, scope, forceLocal) {
        var me = this, params = me.defaultParams ? Ext.clone(me.defaultParams) : {}, fn;

        params[me.primaryKey] = id;

        fn = function() {
            if (me.registry.containsKey(id)) {
                me.registry.removeAtKey(id);
            }
            me.fireEvent('remove', id);
            if (callback) {
                callback.call(scope || me, id);
            }
        };

        if (me.isRemote && forceLocal !== true) {
            me.doRequest(me.removeService, params, fn);
        } else {
            fn.call(me);
        }
    },

    //Private
    add: function(metadata) {
        metadata = o2e.data.MetadataUtils.initMetadata(metadata, this.type);
        this.registry.replace(metadata[this.primaryKey], metadata);
    },

    //Private
    doRequest: function(serviceId, params, success) {
         o2e.connectorMgr.query({
            componentId: this.id,
            connectionType: 'metadata',
            serviceId: serviceId,
            params: params,
            success: success,
            failure: this._onError,
            scope: this
        });
    },

    //Private
    _onError: function(serviceKey, errorMessage) {
        o2e.log.error('Metadata call failed: '+ errorMessage, true);
    }

});