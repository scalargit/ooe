/**
 * @class o2e.widget.AbstractContainer
 *
 * <p>Responsible for providing shell for widgets so that they may inject toolbar/menu items into their container.
 * So herein we handle the config plugins.</p>
 *
 * <p>This allows us to have different containers (i.e. different look and feel, different toolbars/menus) for the
 * same widgets in different contexts.</p>
 */
Ext.define('o2e.widget.AbstractContainer', {

    /**
     * @cfg {Array} desiredPlugins Array of plugin IDs representing config plugins this container
     * would like to use in addition to ones automatically created for the widget in use
     */
    desiredPlugins: null,

    /**
     * @property {Object} widget Reference to the widget this container is wrapping.
     */
    widget: null,
    /**
     * @property {Object} plugins Object containing all of the instances of the plugins in use, keyed by their pluginID.
     */
    configPlugins: null,
    /**
     * @property {Array} widgetPlugins Array of plugin IDs representing widget specific plugins (versus container
     * specific plugins).
     */
    widgetPlugins: null,

    /**
     * Initializes the container by building the config plugins. Override if you need any specific initialization for
     * your particular container implementation.
     */
    init: function() {
        this.buildWidgetPlugins();
        this.buildDesiredPlugins();
    },

    /**
     * Invokes init on each of the plugins.
     */
    initPlugins: function() {
        var id;
        for (id in this.configPlugins) {
            if (this.configPlugins.hasOwnProperty(id) && this.configPlugins[id].init) {
                this.configPlugins[id].init();
            }
        }
    },

    /**
     *
     */
    getStateConfig: function() {
        var plugins = {}, id;

        for (id in this.configPlugins) {
            if (this.configPlugins.hasOwnProperty(id)) {
                plugins[id] = this.configPlugins[id].getStateConfig();
            }
        }

        return {
            //TODO: need to add size and positioning to the container state
            configPlugins: plugins,
            title: this.title,
            xtype: this.xtype
        };
    },

    /*
     * Creates all plugins that are configured for the widget in use and sets this.widgetPlugins.
     */
    //Private
    buildWidgetPlugins: function() {
        var plugins, i, len, pluginItems = [], me = this;

        if (me.configPlugins === null) {
            me.configPlugins = {};
        }

        plugins = o2e.configPluginMgr.find(me.widget.type);
        for (i=0, len=plugins.length; i<len; i++) {
            this.createPlugin(plugins[i]);
            pluginItems.push(me.configPlugins[plugins[i]]);
        }

        this.widgetPlugins = pluginItems;
    },

    /*
     * Creates all plugins that this container wants.
     */
    //Private
    buildDesiredPlugins: function() {
        var i, len, pluginID;
        for (i=0, len=this.desiredPlugins.length; i<len; i++) {
            pluginID = this.desiredPlugins[i];
            this.createPlugin(pluginID, this.configPlugins[pluginID]);
        }
    },

    //Private
    createPlugin: function(pluginId, pluginCfg) {
        var plugin, me = this;

        if (!pluginCfg) {
            pluginCfg = {};
        }

        pluginCfg.widget = me.widget;

        if (this.configPlugins.hasOwnProperty(pluginId)) {
            Ext.apply(pluginCfg, me.configPlugins[pluginId]);
        }

        plugin = o2e.configPluginMgr.create(pluginId, pluginCfg);

        me.configPlugins[pluginId] = plugin;

        return plugin;
    }

});