/**
 * @class o2e.action.ActionMgr
 *
 * TODO: fix for Ext ClassLoader
 *
 * @singleton
 */
Ext.define('o2e.action.ActionMgr', {

    singleton: true,

    actions: null,

    /**
     * @param {o2e.action.Action} action
     */
    reg: function(action) {
        var name = action.prototype.name;
        if (!name) {
            o2e.log.warn("Unable to register action. No name specified", false);
        } else if (this.actions.hasOwnProperty(name)) {
            o2e.log.warn("Action with name \""+name+"\" already existings. Skipping registration...", false);
        } else {
            if (o2e.log.isDebugEnabled()) {
                o2e.log.debug("Registered action: "+name, false);
            }
            this.actions[name] = action;
        }
    },

    /**
     * Config object including showDefaults, source, payload and category
     * @param {Object} cfg
     *
     * TODO: can we have actions be singletons instead of instantiated every time?
     */
    getMenuItems: function(cfg) {
        var name, action, items = [], defItems = [];
        for (name in this.actions) {
            if (this.actions.hasOwnProperty(name)) {
                action = this.actions[name];
                if (action.isCompatible(cfg)) {
                    // If showDefaults is enabled, include all default actions.
                    // Also include all actions whose category is in the provided list
                    if (action.isDefault && cfg.showDefaults) {
                        defItems.push(Ext.create(action, cfg));
                    } else if (!action.isDefault && Ext.Array.indexOf(action.categories, cfg.category) !== -1) {
                        items.push(Ext.create(action, cfg));
                    }
                }
            }
        }
        // Add a separator only if there are default and non-default items
        if (items.length > 0 && defItems.length > 0) {
            items.push('-');
        }
        if (defItems.length > 0) {
            items = items.concat(defItems);
        }
        if (items.length === 0) {
            items.push({
                text: '<i>No Actions Available</i>'
            });
        }
        return items;
    },

    /**
     * Config object including event or x,y, source, payload, showDefaults, and category
     * @param {Object} cfg
     */
    showContextMenu: function(cfg) {
        var xy, menu;

        if (cfg.event) {
            cfg.event.preventDefault();
            xy = cfg.event.getXY();
        } else if (cfg.x !== undefined && cfg.y !== undefined) {
            xy = [cfg.x, cfg.y];
        } else {
            o2e.log.warn('No xy parameters provided for actions contextMenu. Defaulting to 0,0');
            xy = [0, 0];
        }
        if (!cfg.items) {
            cfg.items = this.getMenuItems(cfg);
        }
        menu = Ext.menu.MenuMgr.get(cfg);
        menu.showAt(xy);
    },

    /**
     * Config object including source, payload and action
     * @param {Object} cfg
     *
     * TODO: future enhancement to allow direct invoke of action sub items
     */
    invokeAction: function(cfg) {
        if (cfg.hasOwnProperty('action') && this.actions.hasOwnProperty(cfg.action)) {
            this.actions[cfg.action].handler(cfg);
        } else {
            o2e.log.error("Invalid action specified.");
        }
    }

    
});
