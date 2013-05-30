/**
 * @class o2e.dashboard.Application
 */
Ext.define('o2e.dashboard.Application', {

    viewport: null,

    northPnl: null,
    eastPnl: null,
    southPnl: null,
    westPnl: null,
    centerPnl: null,

    /**
     * @constructor
     * @param cfg
     */
    constructor: function(cfg) {
        var env = o2e.env;

        this.northPnl = Ext.create('o2e.dashboard.quickpanel.QuickPanelContainer', {
            region: 'north',
            height: env.quickPanelHeight,
            margins: '1 1 0 1'
        });
        this.eastPnl = Ext.create('o2e.dashboard.quickpanel.QuickPanelContainer', {
            region: 'east',
            width: env.quickPanelWidth,
            margins: '1 1 1 0'
        });
        this.southPnl = Ext.create('o2e.dashboard.quickpanel.QuickPanelContainer', {
            region: 'south',
            height: env.quickPanelHeight,
            margins: '0 1 1 1'
        });
        this.westPnl = Ext.create('o2e.dashboard.quickpanel.QuickPanelContainer', {
            region: 'west',
            width: env.quickPanelWidth,
            margins: '1 0 1 1'
        });

        this.centerPnl = Ext.create('o2e.dashboard.workspace.WorkspaceContainer', {
            region: 'center',
            margins: '1 1 1 1'
        });

        this.viewport = Ext.create('Ext.Viewport', {
            layout: 'border',
            items: [this.northPnl, this.eastPnl, this.southPnl, this.westPnl, this.centerPnl]
        });
    },

    /**
     *
     * @param cfg
     */
    applyStateConfig: function(cfg) {
        if (cfg.hasOwnProperty('northPnl')) {
            cfg.northPnl.isTransient = cfg.isTransient;
            this.northPnl.applyStateConfig(cfg.northPnl);
        } else if (!cfg.isTransient) {
            this.northPnl.hide();
        }

        if (cfg.hasOwnProperty('eastPnl')) {
            cfg.eastPnl.isTransient = cfg.isTransient;
            this.eastPnl.applyStateConfig(cfg.eastPnl);
        } else if (!cfg.isTransient) {
            this.eastPnl.hide();
        }

        if (cfg.hasOwnProperty('southPnl')) {
            cfg.southPnl.isTransient = cfg.isTransient;
            this.southPnl.applyStateConfig(cfg.southPnl);
        } else if (!cfg.isTransient) {
            this.southPnl.hide();
        }

        if (cfg.hasOwnProperty('westPnl')) {
            cfg.westPnl.isTransient = cfg.isTransient;
            this.westPnl.applyStateConfig(cfg.westPnl);
        } else if (!cfg.isTransient) {
            this.westPnl.hide();
        }

        if (cfg.hasOwnProperty('centerPnl')) {
            cfg.centerPnl.isTransient = cfg.isTransient;
            this.centerPnl.applyStateConfig(cfg.centerPnl);
        }
    },

    /**
     *
     */
    getStateConfig: function() {
        return {
            northPnl: this.northPnl.getStateConfig(),
            eastPnl: this.eastPnl.getStateConfig(),
            southPnl: this.southPnl.getStateConfig(),
            westPnl: this.westPnl.getStateConfig(),
            centerPnl: this.centerPnl.getStateConfig()
        };
    }

});
