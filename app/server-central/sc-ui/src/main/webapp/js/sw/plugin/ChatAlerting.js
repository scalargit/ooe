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
        //Make UDOP alert too
        this.widget.fireEvent('alertstart', this.widget);
    },    
    
    hookEvents: function() {
        this.widget.on('beforedestroy', this.forceEndAlert, this);
    },

    endAlert: function() {
        this.widget.fireEvent('alertend', this.widget);
    }, 
    
    forceEndAlert: function() {
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