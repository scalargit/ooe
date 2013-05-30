/**
 * @class o2e.data.StoreFactory
 * @singleton
 */
Ext.define('o2e.data.StoreFactory', {

    singleton: true,

    requires: ['Ext.data.Store'],

    create: function(widgetId, modelId) {
        return Ext.create('Ext.data.Store', {
            model: modelId,
            storeId: 'store.'+widgetId
        });
    }

});