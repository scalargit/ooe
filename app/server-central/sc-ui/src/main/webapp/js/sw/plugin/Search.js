Ext.define('sw.plugin.Search', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'search',
    defaultItemClass: 'Ext.toolbar.Toolbar',
    disabled: true,
    searchAnnotation: 'search',

    init: function() {

    },

    createItem: function(itemClass) {

        var myItems = [], myButtons = [], serviceKey, service, input;

        for (serviceKey in this.widget.services) {
            if (this.widget.services.hasOwnProperty(serviceKey)) {
                service = this.widget.services[serviceKey];
                if (service.metadata.ext && !!service.metadata.ext.inputs) {
                    for (input in service.metadata.ext.inputs) {
                        if (!!input.annotations && input.annotations === this.searchAnnotation) {
                            this.disabled = false;
                            myItems.push(
                                {
                                    xtype: 'textfield',
                                    flex: 1,
                                    listeners: {
                                        afterrender: {
                                            fn: function(f) {
                                                f.focus();
                                            },
                                            single: true
                                        }
                                    }
                                },
                                {
                                    xtype: 'button',
                                    iconCls: 'icon-magnifier',
                                    handler: function() {
                                        alert('click');
                                        console.log("submitted");
                                    }
                                }
                            );
                            this.itemRef = Ext.create(itemClass || this.defaultItemClass, {
                                itemId: this.pluginId,
                                disabled: this.disabled,
                                flex: 1,
                                border: 0,
                                dock: 'top',
                                items: myItems
                            });
                            this.widget.widgetCt.addDocked(this.itemRef);
                        }
                    }
                }
            }
        }


//        return this.itemRef;
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});