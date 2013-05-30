/**
 * @class o2e.widget.AbstractWidget
 * @extends Ext.panel.Panel
 *
 * <p>All O2E widgets should extend from this class. This class directly provides
 * orchestration of data processing by invoking the appropriate handlers in the
 * widget implementation as well as any configured data processor plugins.</p>
 *
 * <p>It also directly provides an API for widget configuration plugins. An AbstractWidget
 * is an Ext.Panel with a card layout. Widget configuration plugins expose menu items
 * to open their respective card(s). Because the widget is a card layout, it is critical
 * to know which panel is the default widget view. The simplest and least limiting
 * way to achieve this is to require this panel to have an itemId of 'default'.</p>
 *
 * <p>Additionally o2e.data.AbstractDataComponent is mixed in with this class. It is
 * implemented as a mixin in order to separate concerns. AbstractDataComponent manages
 * the services within a widget, fetches and deserializes data, and invokes the base
 * handleData() method herein.</p>
 *
 * <p>Implementations of AbstractWidget must implement clearData(), removeData(),
 * updateData(), and addData() or override handleData(). In cases where the widget
 * desires raw data, handleData() must be overridden and the onus is on the widget to
 * figure out what actions to take with the incoming data.</p>
 *
 * <p>Note: the widgets requesting rawData must manually invoke processDataPlugins() within
 * their handleData() implementation.</p>
 */
Ext.define('o2e.widget.AbstractWidget', {

    extend: 'Ext.panel.Panel',
    mixins: {
        datacomponent: 'o2e.data.AbstractDataComponent'
    },

    layout: 'card',
    
    /**
     * @property dataPlugins
     * @type Object
     * A map holding a reference to each plugin keyed by its pluginId.
     */
    dataPlugins: null,

    /**
     * @property availableEventId
     * @type String
     * The ID used to identify this widget in the availableEvent construct.
     */
    availableEventId: null,

    /**
     * @property availableEventSources
     * @type Object
     * A map representing all available event sources for this widget.
     */
    availableEventSources: null,

    /**
     * @property availableEventSources
     * @type Object
     * A map representing all available event actions for this widget.
     */
    availableEventActions: null,

    /**
     * @property type
     * @type String
     * Required. Read-Only. A unique name for this widget.
     */
    type: null,

    /**
     * @property dependencies
     * @type Object
     * An object representing 3rd party dependencies required by this widget implementation. Should follow this format:
     *
     *  {
     *      js: [{className: 'MyObj', filePath: 'http://host/file.js'}, ...],
     *      css: ['http://host/file.css', ...]
     *  }
     */
    dependencies: {
        js: [],
        css: []
    },

    preventHeader: true,
    border: 0,

    constructor: function(cfg) {
        Ext.apply(this, cfg);
        this.widgetCt.widget = this;
        this.mixins.datacomponent.constructor.call(this, cfg);
        this.availableEventActions = {};
        this.availableEventSources = {};
        this.availableEventId = this.availableEventId || Ext.data.IdGenerator.get('uuid').generate();
        this.callParent(arguments);
    },

    //Private
    initComponent: function() {
        this.widgetCt.init();
        this.callParent();
        this.loadDependencies();
    },

    //Private
    loadDependencies: function() {
        var me = this, dependencies = me.dependencies, jsLen = 0, cssLen = 0, callback, count = 0, i, className, filePath;

        if (dependencies.hasOwnProperty('js')) {
            jsLen = dependencies.js.length;
        }
        if (dependencies.hasOwnProperty('css')) {
            cssLen = dependencies.css.length;
        }

        //Only upon successful dependency loading do we continue loading of the widget
        callback = function() {
            count++;
            if (count === jsLen) {
                me.loadMetadata();
            }
        };

        for (i=0; i<cssLen; i++) {
            o2e.util.Loader.requireCss(dependencies.css[i]);
        }

        if (jsLen === 0) {
            me.loadMetadata();
        } else {
            for (i=0; i<jsLen; i++) {
                className = dependencies.js[i].className;
                filePath = dependencies.js[i].filePath;
                o2e.util.Loader.requireJs(className, filePath, callback, me);
            }
        }
    },

    //Private
    loadMetadata: function() {
        var bindMetadataFn, serviceKey, serviceDesc, servicesInitialized = 0,
            totalServices = Ext.Object.getSize(this.services), me = this;

        //First each service must have a reference to its metadata, then we proceed with all the initialization

        bindMetadataFn = function(metadata) {
            serviceDesc.metadata = metadata;
            servicesInitialized++;
            if (servicesInitialized === totalServices) {
                me.completeInit();
            }
        };

        if (totalServices === 0) {
            me.completeInit();
        } else {
            for (serviceKey in me.services) {
                if (me.services.hasOwnProperty(serviceKey)) {
                    serviceDesc = me.services[serviceKey];
                    o2e.serviceRegistry.get(serviceDesc.serviceId, bindMetadataFn, me);
                }
            }
        }
    },

    //Private
    completeInit: function() {
        var plugin, me = this;

        //Initializes config plugins
        me.widgetCt.initPlugins();

        //Builds data plugins
        me.initDataPlugins();

        //Builds data models
        me.initDataComponent();

        //Initializes the data plugins
        for (plugin in me.dataPlugins) {
            if (me.dataPlugins.hasOwnProperty(plugin)) {
                me.dataPlugins[plugin].init();
            }
        }

        // Add default availableEventActions
        me.initEventActions();

        //Widget implementation initialization
        me.init();

        //Invoke subscriptions/requests
        me.loadData();
    },

    beforeDestroy: function() {
        this.unsubscribe();
        this.callParent();
    },
    
    /**
     * Processes the provided data by first allowing each plugin to process the data and then invoking
     * clearData, removeData, addData and updateData (in that order). Override this function if your
     * widget implementation expects rawData.
     *
     * This is NOT invoked if useOwnStores is false. If using framework-built stores, simply listen to their events
     * or tie your view components directly to them.
     *
     * @param {Object} data
     * @param {String} serviceKey
     * @param {Object} metadata
     */
    handleData: function(data, serviceKey, metadata) {
        var me = this;

        me.processDataPlugins(data, serviceKey, metadata);

        if (data.clear) {
            me.clearData(serviceKey, data.clear);
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
    },

    /**
     * Invokes the data handler for each data plugin with the provided parameters.
     *
     * @param data
     * @param serviceKey
     * @param metadata
     */
    processDataPlugins: function(data, serviceKey, metadata) {
        var i, len, pluginIDs = this.services[serviceKey].plugins, plugin;
        for (i=0, len=pluginIDs.length; i<len; i++) {
            plugin = this.dataPlugins[pluginIDs[i]];
            plugin.handleData(data, serviceKey, metadata);
        }
    },

    addService: function(serviceCfg) {
        var serviceKey = o2e.connectorMgr.getServiceKey(serviceCfg.serviceId, serviceCfg.params), me = this;

        me.services[serviceKey] = serviceCfg;

        if (serviceCfg.plugins === undefined || !Ext.isArray(serviceCfg.plugins)) {
            me.buildDefaultDataPlugins(serviceKey, true);
        } else {
            me.buildConfiguredDataPlugins(serviceKey, true);
        }

        me.mixins.datacomponent.addService.call(me, serviceCfg);

        me.subscribe(serviceKey);
    },

    updateService: function(serviceCfg) {
        var serviceKey = o2e.connectorMgr.getServiceKey(serviceCfg.serviceId, serviceCfg.params), me = this;

        me.services[serviceKey] = serviceCfg;

        if (serviceCfg.plugins === undefined || !Ext.isArray(serviceCfg.plugins)) {
            this.buildDefaultDataPlugins(serviceKey, true);
        } else {
            this.buildConfiguredDataPlugins(serviceKey, true);
        }

        me.mixins.datacomponent.updateService.call(me, serviceCfg);

        me.setServiceActive(serviceKey, true);
    },
    
    /**
     * Clears all data for the given serviceKey from the view. If no serviceKey is provided, it removes
     * all data from the view.
     *
     * This is implemented where useOwnStores is FALSE. For widgets using their own stores, this must
     * be overridden!
     *
     * @param {String} serviceKey (optional)
     */
    clearData: function(serviceKey) {
        var me = this, currServiceKey, found, x, xlen, uidField, items;
        if (!me.useOwnStores) {
            if (me.unionData) {
                if (serviceKey !== undefined) {
                    for (currServiceKey in me.services) {
                        if (me.services.hasOwnProperty(currServiceKey) && currServiceKey !== serviceKey) {
                            found = true;
                        }
                    }

                    if (found === true) {
                        uidField = o2e.data.DataUtils.getFieldWithAnnotation('uid', me.services[serviceKey].metadata);
                        items = me.store.snapshot ? me.store.snapshot.items : me.store.data.items;

                        me.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing all records');

                        for (x=0,xlen=me.currentRecords[serviceKey].length;x<xlen;x++) {
                            found = o2e.data.DataUtils.findMatchingRecord(items, uidField, me.currentRecords[serviceKey][x]);
                            if (found !== false && found >= 0) {
                                me.store.remove(items[found]);
                            }
                        }

                        me.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Total records: 0');
                    } else {
                        me.store.removeAll();
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing all records');
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Total records: 0');
                    }

                    delete me.currentRecords[serviceKey];
                    me.currentRecords[serviceKey] = [];
                } else {
                    me.store.removeAll();
                    for (currServiceKey in me.services) {
                        if (me.services.hasOwnProperty(currServiceKey)) {
                            this.fireEvent('servicestatus', currServiceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing all records');
                            this.fireEvent('servicestatus', currServiceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Total records: 0');
                            delete me.currentRecords[currServiceKey];
                            me.currentRecords[currServiceKey] = [];
                        }
                    }
                }
            } else {
                if (serviceKey !== undefined) {
                    this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing all records');
                    me.stores[serviceKey].removeAll();
                    delete me.currentRecords[serviceKey];
                    me.currentRecords[serviceKey] = [];
                    this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Total records: 0');
                } else {
                    for (currServiceKey in me.services) {
                        if (me.services.hasOwnProperty(currServiceKey)) {
                            me.clearData(currServiceKey);
                        }
                    }
                }
            }
        }
    },
    
    /**
     * Removes an array of record objects from the view.
     *
     * @param {Array} records
     * @param {String} serviceKey
     * @param {Object} metadata
     */
    removeData: Ext.emptyFn,
    
    /**
     * Adds an array of record objects to the view.
     *
     * @param {Array} records
     * @param {String} serviceKey
     * @param {Object} metadata
     */
    addData: Ext.emptyFn,
    
    /**
     * Updates an array of record objects in the view.
     *
     * @param {Array} records
     * @param {String} serviceKey
     * @param {Object} metadata
     */
    updateData: Ext.emptyFn,

    /**
     * Default implementation to return the widget state. This should be overridden by all widgets that create state
     * information that should be maintained. Data should NOT be included in this.
     *
     * @return {Object} An object containing the widget state.
     */
    getWidgetStateConfig: Ext.emptyFn,

    /**
     * Basic implementation of persistence for a widget. Will gather the state of each component within the widget.
     * Expects an implementation of getWidgetStateConfig().
     *
     * @return {Object} The full widget state.
     */
    getStateConfig: function() {
        var state = this.getWidgetStateConfig() || {},
            plugin;

        for (plugin in this.dataPlugins) {
            if (this.dataPlugins.hasOwnProperty(plugin)) {
                Ext.apply(state, this.dataPlugins[plugin].getStateConfig());
            }
        }

        Ext.apply(state, {
            dataPlugins: true, //Just a placeholder to denote that plugins are already configured
            widgetCt: this.ownerCt.getStateConfig(), //This will be used by the widget factory
            widgetTypeId: this.widgetTypeId, // This is needed to restore state with widget factory
            availableEventId: this.availableEventId //This is needed to restore widget linking from state
        });

        //This should go last because it is most important.
        Ext.apply(state, this.mixins.datacomponent.getStateConfig.call(this));

        return state;
    },

    //Private
    initDataPlugins: function(callback, scope) {
        var serviceKey, me = this;

        // If dataPlugins are not configured already, find/create/init default data plugins.
        // Otherwise create/init the configured ones.
        if (me.dataPlugins === null) {
            me.dataPlugins = {};

		    // Build default data plugin chain
            for (serviceKey in me.services) {
                if (me.services.hasOwnProperty(serviceKey)) {
                    me.buildDefaultDataPlugins(serviceKey);
                }
            }
        } else {
            me.dataPlugins = {};

            // Build configured data plugin chain for each existing service
            for (serviceKey in me.services) {
                if (me.services.hasOwnProperty(serviceKey)) {
                    me.buildConfiguredDataPlugins(serviceKey);
                }
            }
        }

    },

    //Private
    buildDefaultDataPlugins: function(serviceKey, doInit) {
        var serviceCfg, pluginIDs, i, len;

        serviceCfg = this.services[serviceKey];
        serviceCfg.plugins = [];

        pluginIDs = o2e.dataPluginMgr.find(serviceCfg.serviceId, this.type, serviceCfg.metadata);

        // We only need one instance of a plugin per widget, but we want a list of plugins per service too
        for (i=0, len=pluginIDs.length; i<len; i++) {
            // If the plugin was created correctly, add it to the list of plugins for this service
            if (this.buildDataPlugin(pluginIDs[i], doInit) !== null) {
                serviceCfg.plugins.push(pluginIDs[i]);
            }
        }
    },

    //Private
    buildConfiguredDataPlugins: function(serviceKey, doInit) {
        var serviceCfg, pluginIDs, i, len;

        serviceCfg = this.services[serviceKey];
        pluginIDs = serviceCfg.plugins;

        // We only need one instance of a plugin per widget, but we want a list of plugins per service too
        for (i=0, len=pluginIDs.length; i<len; i++) {
            // If the plugin was not created correctly, remove it from this service's plugin list
            if (this.buildDataPlugin(pluginIDs[i], doInit) === null) {
                pluginIDs.splice(i, 1);
            }
        }
    },

    //Private
    buildDataPlugin: function(pluginID, doInit) {
        var plugin;
        if (this.dataPlugins.hasOwnProperty(pluginID)) {
            return this.dataPlugins[pluginID];
        } else {
            plugin = o2e.dataPluginMgr.create(pluginID, {
                widget: this
            });
            if (plugin !== null) {
                this.dataPlugins[pluginID] = plugin;
                if (doInit) {
                    plugin.init();
                }
            }
            return plugin;
        }
    },

    /**
     * Adds an event source to this widget.
     *
     * @param {Object} cfg Config for event source. name: source name, source: source object, event: event name, args: Array of event args configs, index: index of arguments (optional)
     */
    addAvailableEventSource: function(cfg) {
        this.availableEventSources[cfg.name] = cfg;
    },

    /**
     * Adds an event action to this widget.
     *
     * @param {Object} cfg Config for event action. name: action name, callback: action fn, scope: callback scope, args: String array of action arg names
     */
    addAvailableEventAction: function(cfg) {
        this.availableEventActions[cfg.name] = cfg;
    },

    initEventActions: function() {
        this.addAvailableEventAction({
            name: 'filter',
            callback: function(filterString) {
                var serviceKey, newFilter = [{
                    operator: 'contains',
                    value: filterString,
                    useAnd: true
                }];
                for (serviceKey in this.services) {
                    if (this.services.hasOwnProperty(serviceKey)) {
                        this.services[serviceKey].filters = newFilter;
                        if (this.useOwnStores || this.useRawData) {
                            this.removeCurrentData(serviceKey);
                            this.pushCurrentData(serviceKey);
                        } else {
                            this.processStoreFilters(serviceKey, this.services[serviceKey].metadata);
                        }
                    }
                }
            },
            scope: this,
            args: ['filterString']
        });
    }

});
