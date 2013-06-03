Ext.define('sw.plugin.ChatAlerting', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'chatAlert',
    widgetType: 'chat',
    
    item: null,
    iconCls: 'icon-alerts',
    text: 'Alert All',
    defaultItemClass: 'Ext.menu.CheckItem',    

    init: function() {
        o2e.env.xmppMgr.on('usermessage', this.checkForAlert, this);
        
        var widget = this.widget;

        widget.addEvents('alertstart', 'alertend');
        if (widget.rendered) {
            this.hookEvents();
        } else {
            widget.on('afterrender', this.hookEvents, this);
        }        
    },
    
    checkForAlert: function(jid) {
        if (this.widget.initChatroom) {
            for (x=0; this.widget.configuredChats.length > x; x++) {
                if (this.widget.configuredChats[x].toUser === jid && this.widget.alertActive) {
                    this.startAlert(jid);
                }
            }
        } else {
            if (this.widget.initToUser === jid && this.widget.alertActive) {
                this.startAlert(jid);
            }  
        }
    },
    
    startAlert: function(jid) {
        var ct = this.widget.widgetCt;
        ct.blinkTask = ct.blinkTask || Ext.TaskManager.start({
            run: function() {
                var btn = this.header.getEl().down('.x-panel-header-text-default-framed');
                if (btn.hasCls('sw-alert-header')) {
                    btn.removeCls('sw-alert-header')
                } else {
                    btn.addCls('sw-alert-header');
                }
            },
            scope: ct,
            interval: 500
        });
        
        //Make UDOP alert too
        this.widget.fireEvent('alertstart', this.widget);
    },    
    
    hookEvents: function() {
        this.widget.widgetCt.header.on('click', this.endAlert, this);
        this.widget.on('beforedestroy', this.forceEndAlert, this);
    },

    endAlert: function() {
        var ct = this.widget.widgetCt, header = ct.header.getEl().down('.x-panel-header-text-default-framed');
        if (ct.blinkTask) {
            Ext.TaskManager.stop(ct.blinkTask);
            ct.blinkTask = null;
        }
        if (header.hasCls('sw-alert-header')) {
            header.removeCls('sw-alert-header');
        }
        
        this.widget.fireEvent('alertend', this.widget);
    }, 
    
    forceEndAlert: function() {
        var ct = this.widget.widgetCt;
        if (ct.blinkTask) {
            Ext.TaskManager.stop(ct.blinkTask);
            ct.blinkTask = null;
        }

        //TODO: this seems to fail because the widget has already closed and it leaves the udop blinking. Boo
        this.widget.fireEvent('alertend', this.widget);
    },    

    createItem: function() {
        
        this.itemRef = Ext.create(this.defaultItemClass, {
            iconCls: this.iconCls,
            text: this.text,
            itemId: this.pluginId,
            disabled: this.disabled,
            menu: [{
                xtype: 'menucheckitem',
                text: this.widget.initToUser,
                checked: this.widget.alertActive,
                listeners: {
                    checkchange: this.onCheck,
                    scope: this
                }
            }],
            listeners: {
                checkchange: this.onCheck,
                scope: this
            }
        });

        return this.itemRef;
    },

    onCheck: function(item, checked) {
        //Users can alert on content of entire chat widget only, if multiple tabs of rooms they will all be alerted
        this.widget.alertActive = checked; 
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});