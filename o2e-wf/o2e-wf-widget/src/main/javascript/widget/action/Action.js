/**
 * @class o2e.action.AbstractAction
 * @extends Ext.AbstractAction
 * 
 * Example usage:

    Ext.define('myApp.actions.NewWindowAction', {
        extend: 'o2e.actions.AbstractAction',
        
        name: 'NewWindowAction',
        annotationKey: 'link',
        text: 'Show Link in New Window',
        handler: function(cfg) {
            window.open(cfg.payload.link);
        }
    }, {
        o2e.actionMgr.reg(myApp.actions.NewWindowAction
    });
 *
 */
Ext.define('o2e.action.AbstractAction', {

    /**
     * @cfg {String} name A unique name for this action
     */
    
    /** @cfg {String} text 
     * The text to set for all components using this action (defaults to '').
     * You may place the exact string "{entity}" within this value in order to
     * have it be replaced in a context sensitive fashion. This will be replaced
     * by the entity.
     */
    
    /**
     * @cfg {Array} categories The categories this action takes part in. Note: if isDefault is set to true, this action will show amongst default actions only.
     */

    /**
     * @cfg {Boolean} isDefault Whether this action should be shown by default
     */    
    isDefault: true,
    
    /**
     * @cfg {String} defaultEntity The default name to use in building the text when text contains {entity} (defaults to 'entity').
     */
    entity: 'entity',
    
    /**
     * @cfg {String} annotationKey The annotation to base compatibility upon - if using the default isCompatible() - (defaults to 'uid'). 
     */
    annotationKey: 'uid',
    
    /**
     * 
     * @param {Object} cfg
     */
    constructor: function(cfg) {
        if (cfg.text === undefined) {
            cfg.text = this.text.replace('{entity}', cfg.entity);
        }
        this.callParent(arguments);
    },
    
    isCompatible: function(cfg) {
        return (cfg.hasOwnProperty('payload') && cfg.payload.hasOwnProperty(this.annotationKey));
    },
    
    handler: Ext.emptyFn
});
