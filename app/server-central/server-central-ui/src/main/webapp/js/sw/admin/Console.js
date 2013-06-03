Ext.define('sw.admin.Console', {

    extend: 'Ext.window.Window',

    closable: false,
    collapsible: false,

    width: 800,
    height: 600,

    autoScroll: true,
    initTab: 0,

    initialized: false,

    constructor: function(cfg) {
        this.callParent([cfg]);
        this.addEvents('initialized');
    },

    initComponent: function() {
        Ext.apply(this, {
            title: 'Admin Console',
            layout: 'fit',
            widgetInfo: {},
            closable: true,
            maximized: o2e.env.builderMode,
            items: [Ext.create('Ext.tab.Panel', {
                activeTab: this.initTab,
                defaults: {
                    closable: false,
                    padding: 0
                },
                items: [{
                    xtype: 'sw-widgetwizard'
                },{
                    xtype: 'sw-maplayerwizard'
                },{
                    xtype: 'sw-templatewizard'
                }]
            })],
            listeners: {
                show: {
                    fn: function(w) {
                        w.body.mask('Initializing, please wait...');
                        var widgetTypes = o2e.widgetTypeRegistry.registry.items;
                        for (var x=0,xlen=widgetTypes.length; x<xlen; x++) {
                            if (x === (xlen-1)) {
                                Ext.require(widgetTypes[x].className, function() {
                                    w.getAnnotations();
                                    w.body.unmask();
                                    w.initialized = true;
                                    w.fireEvent('initialized');
                                });
                            } else {
                                Ext.require(widgetTypes[x].className);
                            }
                        }
                    },
                    scope: this
                }
            }
        });

        this.callParent();
    },

    getAnnotations: function() {
        var widgetTypes = o2e.widgetTypeRegistry.registry.items,
            cfg, wid, widgetType, plugins, req, opt, meta;

        for (var y=0,ylen=widgetTypes.length; y<ylen; y++) {
            cfg = widgetTypes[y];
            if (cfg.category === 'SYSTEM') {
                continue;
            }
            wid = cfg.widgetTypeId;
            plugins = o2e.dataPluginMgr.findByWidgetType(wid);

            widgetType = eval(cfg.className).prototype;
            req = widgetType.requiredAnnotations;
            opt = widgetType.optionalAnnotations;
            meta = widgetType.requiredMetaFields ? Ext.clone(widgetType.requiredMetaFields) : {};
            for (var plugin, x=0, xlen=plugins.length; x<xlen; x++) {
                plugin = o2e.dataPluginMgr.create(plugins[x], {}).self.prototype;
                req = Ext.Array.merge(req, plugin.requiredAnnotations);
                opt = Ext.Array.merge(opt, plugin.optionalAnnotations);
                meta = plugin.requiredMetaFields ? Ext.applyIf(meta, plugin.requiredMetaFields) : meta;
            }
            this.widgetInfo[wid] = { required: req, optional: opt, metaFields: meta, name: cfg.properName };
        }
    },

    loadMetadata: function(meta) {
        if (this.initialized) {
            this.items.getAt(0).getActiveTab().loadMetadata(meta);
        } else {
            this.on('initialized', function() {
                this.items.getAt(0).getActiveTab().loadMetadata(meta);
            }, this);
        }
    }
});