Ext.define('sw.admin.TemplateWizard', {
    extend: 'Ext.form.Panel',
    alias: 'widget.sw-templatewizard',

    initComponent: function() {

        Ext.apply(this, {
            title: 'Template Administration',
            border: 0,
            bodyPadding: 10,
            autoScroll: true,
            defaultType: 'fieldset',
            defaults: {
                anchor: '100%'
            },
            monitorValid: true,
            items: [{
                title: 'Template Information',
                defaultType: 'textfield',
                defaults: { anchor: '100%' },
                layout: 'anchor',
                items: [{
                    name: 'name',
                    fieldLabel: 'Name',
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
                }]
            },{
                title: 'Template Content',
                defaultType: 'textareafield',
                defaults: { anchor: '100%' },
                layout: 'anchor',
                items: [{
                    name: 'tplContent',
                    grow: true,
                    allowBlank: false
                }]
            },{
                title: 'Template Methods',
                defaultType: 'textareafield',
                defaults: { anchor: '100%' },
                layout: 'anchor',
                items: [{
                    name: 'tplMethods',
                    grow: true,
                    allowBlank: false,
                    value: '{}'
                }]
            }],
            bbar: ['->',{
                iconCls: 'icon-save',
                text: 'Save',
                handler: function() {
                    var meta = this.getForm().getFieldValues();
                    o2e.tplRegistry[this.uuid ? 'update' : 'insert'](this.uuid, meta, function() {
                        this.ownerCt.ownerCt.close();
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