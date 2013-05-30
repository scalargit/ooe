Ext.define('o2e.container.WindowContainer', {
    extend: 'Ext.panel.Panel',
    mixins: {
        container: 'o2e.widget.AbstractContainer'
    },
    alias: 'widget.o2e-widgetwindow',

    layout: 'fit',
    floatable: false,
    floating: false,
    hidden: false,
    constrain: true,
    maximizable: true,
    shadow: false,

    desiredPlugins: [],
//        'serviceInputForm', 'filterForm', 'favoriteBtn', 'clearBtn',
//        'classificationBadge', 'shareBtn', 'refreshBtn', 'lockBtn',
//        'serviceStatus'],
    constructor: function(cfg) {
//        cfg.layout = 'fit';
//        cfg.floatable = false;
//        cfg.floating = false;
//        cfg.hidden = false;
//        cfg.constrain = true;
        cfg.title = cfg.widget.title;
        this.callParent([cfg]);
        this.configPlugins = {};
    },

    maximize: function() {
        var me = this;

        if (!me.maximized) {
            me.expand(false);
            if (!me.hasSavedRestore) {
                me.restoreSize = me.getSize();
                me.restorePos = me.getPosition(true);
            }
            if (me.maximizable) {
                me.tools.maximize.hide();
                me.tools.restore.show();
            }
            me.maximized = true;

            if (me.dd) {
                me.dd.disable();
            }
            if (me.collapseTool) {
                me.collapseTool.hide();
            }
            me.el.addCls(Ext.baseCSSPrefix + 'window-maximized');
            me.container.addCls(Ext.baseCSSPrefix + 'window-maximized-ct');

            me.syncMonitorWindowResize();
            me.setPosition(0, 0);
            me.fitContainer();
            me.fireEvent('maximize', me);
        }
        return me;
    },

    restore: function() {
        var me = this,
            tools = me.tools;

        if (me.maximized) {
            delete me.hasSavedRestore;
            me.removeCls(Ext.baseCSSPrefix + 'window-maximized');

            // Toggle tool visibility
            if (tools.restore) {
                tools.restore.hide();
            }
            if (tools.maximize) {
                tools.maximize.show();
            }
            if (me.collapseTool) {
                me.collapseTool.show();
            }

            // Restore the position/sizing
            me.setPosition(me.restorePos);
            me.setSize(me.restoreSize);

            // Unset old position/sizing
            delete me.restorePos;
            delete me.restoreSize;

            me.maximized = false;

            // Allow users to drag and drop again
            if (me.dd) {
                me.dd.enable();
            }

            me.container.removeCls(Ext.baseCSSPrefix + 'window-maximized-ct');

            me.syncMonitorWindowResize();
            me.doConstrain();
            me.fireEvent('restore', me);
        }
        return me;
    }

//    constructor: function(cfg) {
//        var menuItems, bbarCfg, plugins = this.desiredPlugins;
//
//        this.buildDesiredPlugins();
//
//        menuItems = [
//            plugins.serviceInputForm.getItem(),
//            plugins.filterForm.getItem(),
//            plugins.favoriteBtn.getItem(),
//            plugins.clearBtn.getItem(),
//            '-'];
//        menuItems = menuItems.concat(this.buildWidgetPlugins());
//
//        bbarCfg = {
//            items: [
//                plugins.classificationBadge.getItem(),
//                '->',
//                {
//                    icon: 'images/icons/gear.png',
//                    menu: {
//                        xtype: 'menu',
//                        itemId: 'widgetMenu',
//                        items: menuItems
//                    }
//                },
//                plugins.shareBtn.getItem(),
//                plugins.refreshBtn.getItem(),
//                plugins.lockBtn.getItem(),
//                plugins.serviceStatus.getItem()
//            ]
//        };
//
//        cfg.bbar = new Ext.Toolbar(bbarCfg);
//
//        this.callParent([cfg]);
//    }

});