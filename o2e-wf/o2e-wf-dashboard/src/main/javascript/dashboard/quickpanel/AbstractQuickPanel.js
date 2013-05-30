/**
 * @class o2e.dashboard.quickpanel.AbstractQuickPanel
 *
 */
Ext.define('o2e.dashboard.quickpanel.AbstractQuickPanel', {

    mixins: {
        workspace: 'o2e.dashboard.workspace.AbstractWorkspace'
    },

    bodyStyle: {
        border: 'none'
    },

    isTransient: false,

//    constructor: function() {
//        this.callParent(arguments);
//    },

    /**
     *
     * @param cfg
     */
    applyStateConfig: function(cfg) {
        var i, len, widgetCfg;
        if (cfg.hasOwnProperty('widgets')) {
            //Insert each widget at the front so that profile widgets always get added first
            for (i=0, len=cfg.widgets.length; i<len; i++) {
                widgetCfg = cfg.widgets[i];
                widgetCfg.container = {
                    closable: !cfg.isTransient,
                    iconCls: cfg.isTransient ? 'icon-profile' : '',
                    hideCollapseTool: this.hideCollapseTool
                };
                this.addWidget.call(this, widgetCfg, 0);
            }
        }
    },

    /**
     *
     */
    getStateConfig: function() {
        var widgets = [], i, item;
        //Must go in reverse order because state is loaded in reverse order
        for (i=this.items.getCount()-1; i>=0; i--) {
            item = this.items.getAt(i);
            if (!item.isTransient) {
                widgets.push(item.getStateConfig());
            }
        }
        return {
            widgets: widgets
        };
    }
});
