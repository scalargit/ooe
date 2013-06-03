Ext.define('sw.xmpp.ConnectDialog', {
    extend: 'Ext.window.Window',
    title: 'Login to Chat',
    modal: true,
    collapsible: false,
    draggable: false,
    resizable: false,
    maximizable: false,
    defaults: { xtype: 'textfield', allowBlank: false, anchor: '100%' },
    layout: 'anchor',
    bodyPadding: 10,

    initComponent: function() {
        Ext.apply(this, {
            items: [{
                fieldLabel: 'Username',
                name: 'username'
            },
            {
                fieldLabel: 'Password',
                name: 'password',
                inputType: 'password'
            },
            {
                xtype: 'fieldset',
                title: 'Advanced options',
                collapsible: true,
                collapsed: true,
                defaults: { xtype: 'textfield', allowBlank: true, anchor: '100%' },
                items: [
                    {
                        fieldLabel: 'Host',
                        name: 'host'
                    },
                    {
                        fieldLabel: 'Port',
                        name: 'port'
                    },
                    {
                        fieldLabel: 'Domain',
                        name: 'serviceName'
                    }
                ]
            }],
            bbar: [{
                text: 'Login',
                formBind: true,
                handler: this.doLogin,
                scope: this
            },{
                text: 'Cancel',
                handler: function(btn) {
                    this.close();
                },
                scope: this
            }],
            listeners: {
                afterrender: {
                    fn: function() {
                        this.keyNav = Ext.create('Ext.util.KeyNav', this.el, {
                            enter: function() {
                                if (this.getForm().isValid()) {
                                    this.doLogin();
                                }
                            },
                            scope: this
                        });
                    },
                    scope: this
                }
            }
        });

        this.callParent();
    },

    doLogin: function(btn) {
        this.getEl().mask('Please wait...');
        var loginInfo = this.getForm().getValues();
        if (loginInfo.host && loginInfo.host !== '' && loginInfo.port && loginInfo.port !== '') {
            o2e.env.xmppMgr.connectToHost(loginInfo.username, loginInfo.password, loginInfo.host, loginInfo.port, loginInfo.serviceName, this.connectHandler, function() { this.getEl().unmask(); }, this);
        } else {
            o2e.env.xmppMgr.connect(loginInfo.username, loginInfo.password, this.connectHandler, function() { this.getEl().unmask(); }, this);
        }
    },

    initItems: function() {
        this.form = Ext.create('Ext.form.Basic', this, Ext.applyIf({listeners: {}}, { monitorValid: true }));
        this.callParent();
        this.form.initialize();
    },

    getForm: function() {
        return this.form;
    }
});