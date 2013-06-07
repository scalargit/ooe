Ext.define('sw.capco.ConfigPlugin', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'classification',
    classification: '',
    cls: '',

    init: function() {
        this.classification = o2e.env.defaultClassification;
        this.cls = o2e.env.defaultClassificationStyle;
        this.widget.on('classification', this.updateClassification, this);
    },

    onServiceAdd: function(widgetId, serviceKey) {

    },

    onServiceRemove: function(widgetId, serviceKey) {

    },

    createItem: function() {
        return this.itemRef = Ext.create('sw.capco.Item', {
            classification: this.classification,
            cls: this.cls,
            listeners: {
                afterrender: {
                    fn: function() {
                        this.widget.fireEvent('classification', this.widget, this.classification, this.cls);
                        this.widget.fireEvent('servicestatus', 'Classification', o2e.data.DataUtils.serviceStatus.INFO, 'Initialized widget with system high classification of ' + this.classification);
                    },
                    scope: this
                }
            }
        });
    },

    updateClassification: function(widget, classification, cls) {
        if (this.itemRef) {
            this.itemRef.applyClassification(classification, cls);
        }
        this.widget.fireEvent('servicestatus', 'Classification', o2e.data.DataUtils.serviceStatus.INFO, 'Updated widget classification to ' + classification);
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});