/**
 * @class o2e.widget.AbstractDataViewWidget
 * @extends o2e.widget.AbstractWidget
 */
Ext.define('o2e.widget.AbstractDataViewWidget', {
    extend: 'o2e.widget.AbstractWidget',

    // These items should stay as is
    useRawData: false,
    useOwnStores: false,
    unionData: true,

    // This will be created
    dataView: null,

    // This must be overridden with Ext.view.View config options
    dataViewCfg: null,

    // Create the data view and add it to this panel
    init: function() {
        this.dataView = Ext.create('Ext.view.View', Ext.apply({
            itemId: 'default',
            store: this.store
        }, this.dataViewCfg));
        this.dataView.on('itemcontextmenu', this.showActionMenu, this);
        this.add(this.dataView);
        this.setReady();
    },

    //
    showActionMenu: function(dataView, record, item, index, e, options) {
        var annotationMap = record.getAnnotationMap();
        o2e.action.ActionMgr.showContextMenu({
            event: e,
            showDefaults: true,
            source: this,
            payload: annotationMap
        });
    },

    invokeAction: function(dataView, record, item, index, e, options) {
        var annotationMap = record.getAnnotationMap();
        o2e.action.ActionMgr.invokeAction({
            event: e,
            showDefaults: true,
            source: this,
            payload: annotationMap
        });
    }
});