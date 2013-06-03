/**
 * @class Ext.ux.tab.Toolbar
 * @extends Object
 * Plugin (ptype = 'tabtoolbar') for adding a toolbar to a TabBar.
 * @constructor
 * @param {Object} config Configuration options
 * @ptype tabtoolbar
 */
Ext.define('Ext.ux.tab.Toolbar', {
    alias: 'plugin.tabtoolbar',

    constructor: function(config) {
        config = config || {};
        Ext.apply(this, config);
    },

    /**
     * @cfg {String} position The position where the toolbar will appear inside the tabbar. Supported values are
     * 'left' and 'right' (defaults to right).
     */
    position: 'right',

    //private
    init: function(tabPanel) {
        var me = this;
        var toolbarId = me.id;
        delete me.id;

        Ext.apply(tabPanel, me.parentOverrides);
        me.tabPanel = tabPanel;
        me.tabBar = tabPanel.tabBar;

        // ensure we have a valid position
        if (this.position !== 'left') {
            this.position = 'right';
        }

        me.tabBar.on({
            afterlayout: function() {
                me.layout = me.tabBar.layout;

                // we need to subtract the toolbar width from this function result
                me.layout.getLayoutTargetSize = Ext.Function.bind(me.getLayoutTargetSize, me);

                var scrollerEl = me.tabBar.body.child('.' + Ext.baseCSSPrefix + 'box-scroller-' + this.position),
                    contentEl = me.tabBar.body.createChild({
                        style: 'width:' + this.width + 'px;',
                        cls: Ext.baseCSSPrefix + 'tab-toolbar-' + this.position
                    }, scrollerEl);

                // if scroller is not created (only one tab)
                // we need to add the floating style to the tab bar
                if (scrollerEl == undefined) {
                    me.tabBar.body.child('.' + Ext.baseCSSPrefix + 'box-inner').setStyle({
                        'float': this.position == 'left' ? 'right' : 'left'
                    })
                }

                me.toolbar = new Ext.toolbar.Toolbar({
                    cls: 'x-tab-toolbar',
                    renderTo: contentEl,
                    items: this.items || [],
                    id: toolbarId
                });

                me.tabBar.doLayout();
            },
            beforedestroy: function() {
                me.toolbar.destroy();
            },
            scope: this,
            single: true
        });
    },

    /**
     * Override the default getLayoutTargetSize of the tabbar layout so we
     * can subtract the width of the toolbar
     */
    getLayoutTargetSize: function() {
        var me = this,
            result = Ext.getClass(me.layout).prototype.getLayoutTargetSize.apply(me.layout, arguments);

        result.width -= this.width;
        return result;
    }

});