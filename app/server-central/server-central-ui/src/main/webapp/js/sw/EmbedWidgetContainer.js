Ext.define('sw.EmbedWidgetContainer', {

    extend: 'Ext.panel.Panel',
    alias: 'widget.sw-embedwidgetcontainer',
    mixins: {
        container: 'o2e.widget.AbstractContainer'
    },

    dockedItems: [{
        xtype: 'toolbar',
        itemId: 'toolbar',
        dock: 'bottom'
    }],

    layout: 'fit',
    anchor: '100%',
    flex: 1,

    desiredPlugins: ['wiring'],

    init: function() {
        var me = this;
        me.dropTargetDDGroups = [];
        me.mixins.container.init.call(this);

        me.addListener('afterlayout', function() {
            this.setSize(this.getWidth(), this.getHeight());
            if (o2e.env.hideTitleBar) {
                this.removeDocked(this.getDockedItems('header')[0]);
            }
            if (o2e.env.hideToolbar) {
                this.removeDocked(this.getDockedItems('toolbar')[0]);
            }
        }, me, { single: true });
    },

    initPlugins: function() {
        var i, ilen, toolbar, plugins, me = this;

        me.mixins.container.initPlugins.call(this);

        if (!o2e.env.hideToolbar) {
            toolbar = me.getComponent('toolbar');
            plugins = me.configPlugins;

            toolbar.add('->');
            toolbar.add({
                iconCls: 'icon-manage',
                itemId: 'gear',
                menu: []
            });

            for (i=0,ilen=me.widgetPlugins.length; i<ilen; i++) {
                if (i === 0) {
                    toolbar.getComponent('gear').menu.add('-');
                }
                toolbar.getComponent('gear').menu.add(me.widgetPlugins[i].createItem());
            }
        } else {
            for (i=0,ilen=me.widgetPlugins.length; i<ilen; i++) {
                me.widgetPlugins[i].createItem();
            }
        }

        this.widget.on('ready', function() {
            this.doComponentLayout();
        }, this, {single: true});
    },

    getStateConfig: function() {
        return Ext.apply({
            height: this.trackedHeight,
            heightRatio: this.trackedHeight / this.up('portalpanel').getHeight()
        }, this.mixins.container.getStateConfig.call(this));
    }
});