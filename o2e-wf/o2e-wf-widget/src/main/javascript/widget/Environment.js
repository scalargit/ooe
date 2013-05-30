/**
 * @class o2e.Environment
 * @extends Ext.util.Observable
 *
 * Environment allows system level configuration and bootstrapping an O2E WF Environment. Extend this class
 * to provide additional configuration or override defaults.
 */
Ext.define('o2e.Environment', {
    
    mixins: {
        observable: 'Ext.util.Observable'
    },
    
    /**
     * @constructor
     * @param {Object} config
     */
    constructor: function(config) {
        var me = this, i, len, registries = me.registries, registry;

        Ext.apply(this, config);

        if (this.o2eContextOverride) {
            this.url = this.o2eServerProtocol+'//'+this.o2eServerHost+':'+this.o2eServerPort+'/'+this.o2eServerContext+'/cometd';
        } else if (this.o2eServerContext) {
            this.url = window.location.protocol+'//'+window.location.host+'/'+this.o2eServerContext+'/cometd';
        }

        this.addEvents(
            /**
             * @event load
             * Fires when the environment has been fully loaded
             */
            'load'
        );

        // Namespace this
        o2e.env = me;

        // Setup the logger
        o2e.log = o2e.util.Logger;
        o2e.log.logLevel = me.logLevel;
        o2e.log.messageBoxLevel = me.msgLevel;
        o2e.log.useFirebug = me.useFirebug;

        // Shortcuts for the factories
        o2e.widgetFactory = o2e.widget.WidgetFactory;
        o2e.modelFactory = o2e.data.ModelFactory;
        o2e.storeFactory = o2e.data.StoreFactory;

        // Shortcuts for the managers
        o2e.dataPluginMgr = o2e.plugin.DataPluginMgr;
        o2e.configPluginMgr = o2e.plugin.ConfigPluginMgr;
        o2e.connectorMgr = o2e.connector.ConnectorMgr;
        o2e.actionMgr = o2e.action.ActionMgr;

        // Construct Comet Server connector
        me.connector = Ext.create('o2e.connector.CometConnector', {
            url: me.url,
            maxConnections: me.maxConnections,
            maxNetworkDelay: me.maxNetworkDelay,
            autoBatch: me.autoBatch,
            allowCrossDomain: me.allowCrossDomain,
            allowWebSocket: me.allowWebSocket,
            redirectUrl: o2e.env.redirectPage || 'about:blank'
        });
        o2e.connectorMgr.reg(me.connector.type, me.connector);

        if (registries !== null) {
            for (i=0, len=registries.length; i<len; i++) {
                registry = registries[i];
                if (me[registry]) {
                    o2e[registry] = Ext.create('o2e.data.MetadataRegistry', me[registry]);
                }
            }
        }

        o2e.app = Ext.create(me.application, {});
    },
    
    /**
     * Initializes the environment.
     */
    init: function() {
        var me = this;

        // Initiate comet connection and continue load process
        me.connector.on('connect', me._onConnect, me);
        me.connector.connect();
        me._onConnect(true);
    },
    
    //private
    _onConnect: function(successful) {
        var me = this;

        if (successful) {
            me.connector.un('connect', me._onConnect, me);



            me.fireEvent('load');
        }
    },

    /**
     * @type {o2d.data.AbstractConnector}
     * @property connector
     */
    connector: null,
    /**
     * @cfg {o2e.AbstractApplication} application
     */
    application: null,
    /**
     * @cfg {Boolean} debug Defaults to false.
     */
    debug: false,
    /**
     * @cfg {Number} logLevel Defaults to 3 (INFO).
     */
    logLevel: 3,
    /**
     * @cfg {Number} msgLevel Defaults to (ERROR).
     */
    msgLevel: 0,
    /**
     * @cfg {Boolean} useFirebug Defaults to false.
     */
    useFirebug: false,
    /**
     * @cfg {Mixed} logHandlers Defaults to undefined.
     */
    /**
     * @cfg {String} url Comet Server URL
     */
    url: window.location.protocol+'//'+window.location.host+'/turnkey-server/cometd',
    /**
     * @cfg maxConnections CometD max connections. Default varied based on browser.
     */
    maxConnections: Ext.isIE6 || Ext.isIE7 || Ext.isGecko2 ? 2 : 5,
    /**
     * @cfg {Number} maxNetworkDelay (in milliseconds) Defaults to 30000.
     */
    maxNetworkDelay: 30000,
    /**
     * @cfg {Boolean} autoBatch Defaults to true
     */
    autoBatch: true,
    /**
     * @cfg {Boolean} allowWebSocket Defaults to true
     */
    allowWebSocket: true,
    /**
     * @cfg {Boolean} allowCrossDomain Defaults to false
     */
    allowCrossDomain: false,
    /**
     * @cfg {Array} registries
     */
    registries: ['serviceRegistry','widgetTypeRegistry'],

    serviceRegistry: {
        type: 'service',
        isRemote: true,
        primaryKey: 'id',
        getService: 'SYSTEM_widget_get',
        insertService: 'SYSTEM_widget_save',
        updateService: 'SYSTEM_widget_save',
        removeService: 'SYSTEM_widget_remove'
    },

    widgetTypeRegistry: {
        type: 'widgetType',
        isRemote: false,
        primaryKey: 'widgetTypeId'
    }
}, function() {
    o2e.envCls = Ext.getClassName(this);
});
