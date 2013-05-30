/**
 * @class o2e.dashboard.quickpanel.QuickPanelContainer
 * @extends Ext.panel.Panel
 */
Ext.define('o2e.dashboard.quickpanel.QuickPanelContainer', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.o2e-quickpanelcontainer',

    quickPanel: null,
    layout: 'fit',
    collapsible: true,

    /**
     *
     * @param cfg
     */
    applyStateConfig: function(cfg) {
        var me = this;

        if (cfg.hasOwnProperty('hidden')) {
            me.setVisible(!cfg.hidden);
        }
        if (!cfg.hidden && !this.hidden) {
            if (cfg.hasOwnProperty('title')) {
                me.setTitle(cfg.title);
            }
            if (cfg.hasOwnProperty('width')) {
                me.setWidth(cfg.width);
            }
            if (cfg.hasOwnProperty('height')) {
                me.setHeight(cfg.height);
            }
            if (cfg.hasOwnProperty('quickPanelType')) {
                this.quickPanel = this.add({
                    xtype: cfg.quickPanelType
                });
            }
            if (cfg.hasOwnProperty('quickPanel') && this.quickPanel !== null) {
                cfg.quickPanel.isTransient = cfg.isTransient;
                this.quickPanel.applyStateConfig(cfg.quickPanel);
            }
        }
    },

    /**
     *
     */
    getStateConfig: function() {
        return {
            title: this.title,
            hidden: this.hidden,
            width: this.getWidth(),
            height: this.getHeight(),
            quickPanelType: this.quickPanel.alias,
            quickPanel: this.quickPanel.getStateConfig()
        };
    }
});
