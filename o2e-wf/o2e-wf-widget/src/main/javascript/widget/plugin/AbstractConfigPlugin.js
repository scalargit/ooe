/**
 * @class o2e.plugin.AbstractConfigPlugin
 * @extends o2e.plugin.AbstractPlugin
 *
 * Config plugins are stateful and may need to persist information.
 *
 */
Ext.define('o2e.plugin.AbstractConfigPlugin', {

    extend: 'o2e.plugin.AbstractPlugin',

    /**
     * @cfg iconCls
     */
    iconCls: '',
    /**
     * @cfg text
     */
    text: '',
    /**
     * @cfg disabled
     */
    disabled: false,
    /**
     * @cfg widgetType
     */
    widgetType: null,

    /**
     * @property {String} itemId This will be equal to the pluginId.
     */
    itemId: '',

    /**
     * @property {Ext.Component} itemRef A reference to the toolbar/menu item.
     */
    itemRef: null,

    /**
     * @property {String} defaultItemClass An class string for the toolbar/menu item (container can override). Defaults to 'Ext.button.Button'.
     */
    defaultItemClass: 'Ext.button.Button',

    /**
     * @param {String} itemClass Override the default item class
     */
    createItem: function(itemClass) {
        this.itemRef = Ext.create(itemClass || this.defaultItemClass, {
            iconCls: this.iconCls,
            text: this.text,
            itemId: this.pluginId,
            disabled: this.disabled,
            listeners: {
                click: this.handleMenuItemClick,
                scope: this
            }
        });

        return this.itemRef;
    },

    /**
     *
     */
    getPanel: function() {
        return {
            xtype: 'panel',
            itemId: this.pluginId,
            html: 'Base Implementation',
            bbar: [{
                text: 'close',
                handler: this.handlePanelClose,
                scope: this
            }]
        };
    },

    /**
     *
     * @param item
     * @param e
     */
    handleMenuItemClick: function(item, e) {
        if (!this.infoPanel) {
            this.infoPanel = Ext.create('Ext.window.Window', {
                autoScroll: true,
                closable: true,
                closeAction: 'hide',
                draggable: false,
                hideMode: 'offsets',
                resizable: true,
                resizeHandles: 'e w',
                layout: 'card',
                renderTo: this.widget.widgetCt.up('portalpanel').body.dom,
                // render it off screen so it animates nicely
                x: -10000,
                y: -10000,
                // set initial width to 200, height to match parent (because we're rendering it left or right)
                width: 300,
                height: this.widget.widgetCt.getHeight(),
                title: Ext.String.capitalize(item.itemId),
                items: []
            });
            // Handle widgetCt height change and window resize (for managed layouts)
            this.widget.widgetCt.on('resize', function(ct, w, h, e) {
                if (!this.infoPanel.isHidden()) {
                    this.showInfoPanel();
                }
            }, this);

            // NOTE: need to uncomment this if using absolute layouts
//            // Handle window resize, see showInfoPanel for more info
//            Ext.EventManager.onWindowResize(function() {
//                if (!this.infoPanel.isHidden()) {
//                    this.showInfoPanel();
//                }
//            }, this);

            // Handle widget destroy by cleaning up the infoPanel
            this.widget.on('beforedestroy', function() {
                this.infoPanel.destroy();
                return true;
            }, this);
            this.showInfoPanel(item);
        } else if (this.infoPanel.isHidden()) {
            this.showInfoPanel(item);
        } else if (this.infoPanel.getComponent(item.itemId) !== this.infoPanel.getLayout().getActiveItem()) {
            this.showInfoPanel(item);
        } else {
            this.handlePanelClose();
        }
    },

    //private
    showInfoPanel: function(item) {
        if (item) {
            if (!this.infoPanel.getComponent(item.itemId)) {
                this.infoPanel.add(this.getPanel(item));
            }
            this.infoPanel.getLayout().setActiveItem(item.itemId);
            this.infoPanel.setTitle(Ext.String.capitalize(item.itemId));
        }

        // Wanted to use Element.anchorTo, but anchorTo doesn't take into account hidden, it uses flyweights
        this.infoPanel.getEl().alignTo(this.widget.widgetCt.header.getEl(), 'tr?', [0,0], {
            easing: 'easeOut',
            duration: 2,
            callback: function() {
                this.infoPanel.hidden = false;
                this.infoPanel.setHeight(this.widget.widgetCt.getHeight());
                this.infoPanel.doLayout();
                this.infoPanel.toFront();
            },
            scope: this
        }, true);
    },

    /**
     *
     */
    handlePanelClose: function() {
        this.infoPanel.close();
    }

});