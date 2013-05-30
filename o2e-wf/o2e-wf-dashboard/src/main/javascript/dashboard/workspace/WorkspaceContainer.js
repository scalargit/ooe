/**
 * @class o2e.dashboard.workspace.WorkspaceContainer
 * @extends Ext.tab.Panel
 *
 */
Ext.define('o2e.dashboard.workspace.WorkspaceContainer', {
    extend: 'Ext.tab.Panel',

    plain: true,
    toolbar: 'o2e.webtop.WebtopToolbar',
    tabBarCls: 'contentPnlTabBar',

    constructor: function(cfg) {
        if (this.toolbar) {
            cfg.bbar = Ext.create(this.toolbar, {context: this});
        }
        if (this.tabBarCls) {
            cfg.tabBar = {
                cls: this.tabBarCls
            };
        }
        this.callParent([cfg]);
    },

    getChildDefaults: function() {
        return {
            context: this
        };
    },

    applyStateConfig: function(cfg) {
        var i, len, wCfg;
        if (cfg.hasOwnProperty('tabs')) {
            for (i=0, len=cfg.tabs.length; i<len; i++) {
                wCfg = Ext.apply({}, cfg.tabs[i], this.getChildDefaults());
                this.insert(0, wCfg);
            }
        }
        if (this.items.getCount() > 0) {
            if (cfg.hasOwnProperty('activeItem') && cfg.activeItem > 0) {
                this.setActiveTab(this.items.getAt(cfg.activeItem));
            } else {
                this.setActiveTab(this.items.getAt(0));
            }
        }
    },

    getStateConfig: function() {
        var tabs = [], i, len, tab;
        for (i=this.items.getCount()-1; i>=0; i--) {
            tab = this.items.getAt(i);
            if (!tab.isTransient) {
                tabs.push(tab.getStateConfig());
            }
        }
        return {
            tabs: tabs,
            activeItem: Ext.Array.indexOf(this.items, this.getActiveTab())
        };
    }

});
