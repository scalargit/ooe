Ext.define('sw.admin.MapLayerWizard', {
    extend: 'Ext.form.Panel',
    alias: 'widget.sw-maplayerwizard',

    initComponent: function() {

        Ext.apply(this, {
            title: 'KML Map Layer Administration',
            border: 0,
            bodyPadding: 10,
            autoScroll: true,
            defaultType: 'fieldset',
            defaults: {
                anchor: '100%'
            },
            monitorValid: true,
            items: [{
                title: 'KML Layer Information',
                defaultType: 'textfield',
                defaults: { anchor: '100%' },
                layout: 'anchor',
                items: [{
                    name: 'name',
                    fieldLabel: 'Layer Name',
                    allowBlank: false
                },{
                    name: 'description',
                    fieldLabel: 'Description',
                    xtype: 'textareafield',
                    grow: true,
                    allowBlank: false
                },{
                    name: 'category',
                    fieldLabel: 'Category',
                    allowBlank: false,
                    value: 'Uncategorized'
                },{
                    name: 'tags',
                    fieldLabel: 'Tags',
                    allowBlank: false,
                    value: 'kml'
                },{
                    name: 'url',
                    fieldLabel: 'URL',
                    allowBlank: false
                }]
            }],
            bbar: ['->',{
                iconCls: 'icon-save',
                text: 'Save',
                handler: function() {
                    var meta = this.getForm().getFieldValues(),
                        notifyAction = this.uuid ? 'update' : 'add';
                    o2e.kmlRegistry[this.uuid ? 'update' : 'insert'](this.uuid, meta, function(d) {
                        this.ownerCt.ownerCt.close();
                        o2e.env.notifyMgr.send('mapLayer', {action: notifyAction, metadata: d});
                    }, this);
                },
                scope: this,
                formBind: true
            },{
                iconCls: 'icon-cancel',
                text: 'Cancel',
                handler: function() {
                    this.ownerCt.ownerCt.close();
                },
                scope: this
            }]
        });

        this.callParent();
    },

    loadMetadata: function(meta) {
        this.getForm().setValues(meta);
        this.uuid = meta.uuid;
    }
});