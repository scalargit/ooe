Ext.define('sw.plugins.ChatSendWidget', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'chatSendWidgetInstance',
    widgetType: 'chat',

    iconCls: 'icon-wiring',
    defaultItemClass: 'Ext.menu.Item',
    text: 'Send Widget',

    init: Ext.emptyFn,

    handleMenuItemClick: function(item, e) {
        var widgetArr = [], widgets = this.widget.widgetCt.up('viewport').down('sw-udopBrowser').getComponent('udopCards').getLayout().getActiveItem().getWidgets(),
            x=0, xlen=widgets.length;

        for (;x<xlen;x++) {
            widgetArr.push({name: widgets[x].title, value: widgets[x].widget});
        }

        Ext.create('Ext.window.Window', {
            title: 'Select Widget',
            modal: true,
            closable: true,
            collapsible: false,
            resizable: false,
            maximizable: false,
            draggable: false,
            width: 400,
            height: 100,
            layout: 'fit',
            items: [Ext.create('Ext.form.Panel', {
                border: 0,
                bodyPadding: 10,
                autoScroll: true,
                defaultType: 'combobox',
                defaults: { anchor: '100%' },
                items: [{
                    itemId: 'widgetCombo',
                    fieldLabel: 'Widget',
                    name: 'widget',
                    store: Ext.create('Ext.data.Store', { fields: ['name', 'value'], data: widgetArr }),
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'value'
                }]
            })],
            bbar: [{
                iconCls: 'icon-ok',
                text: 'Ok',
                handler: function(btn) {
                    var win = btn.ownerCt.ownerCt,
                        state = win.down('form').getValues().widget.getStateConfig();
                    win.close();

                    this.widget.body.mask('Getting URL, please wait...');
                    o2e.connectorMgr.query({
                        componentId: this.id,
                        serviceId: 'SYSTEM_collection_save',
                        params: {
                            collection: 'widgetinstance',
                            json: state
                        },
                        success: function(serviceKey, data, forceRefresh) {
                            var url = window.location.protocol + '//' + window.location.host + window.location.pathname + '?embed=true&hideToolbar=true&hideTitleBar=true&widi=' + data.uuid,
                                textarea = this.widget.down('textareafield');

                            textarea.setValue(url);
                            textarea.attachment = {
                                type: 'widgetInstance',
                                id: data.uuid,
                                metadata: data.uuid
                            };
                            textarea.focus();

                            this.widget.body.unmask();
                        },
                        failure: this._onError,
                        scope: this
                    });
                },
                scope: this
            },{
                iconCls: 'icon-cancel',
                text: 'Cancel',
                handler: function(btn) {
                    btn.ownerCt.ownerCt.close();
                }
            }]
        }).show();
    },

    getStateConfig: function() {
        return this.callParent();
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});