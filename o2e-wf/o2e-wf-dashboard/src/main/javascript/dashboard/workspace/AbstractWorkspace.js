/**
 * @class o2e.dashboard.workspace.AbstractWorkspace
 */
Ext.define('o2e.dashboard.workspace.AbstractWorkspace', {

    isTransient: false,
    closable: true,

    toolbar: null,

    /**
     * @cfg {String} containerClass The type of widget container that this workspace should use.
     */
    containerClass: null,

    initComponent: function() {
        if (this.toolbar !== null) {
            this.tbar = Ext.create(this.toolbar, {context: this});
        }
    },

    /**
     *
     */
    getContainerCfg: function() {
        return {
            closable: !this.isTransient
        };
    },

    createWidget: function(cfg, callback, scope) {
        o2e.widgetFactory.create(cfg.type, cfg, this.containerClass, this.getContainerCfg(), callback, scope);
    },

    /**
     * @param {Object} cfg
     */
    addWidget: function(cfg, position) {
        var widget = this.createWidget(cfg, function() {
            if (position) {
                this.insert(position, widget);
            } else {
                this.add(widget);
            }
        }, this);
    },

    getStateConfig: Ext.emptyFn
});
