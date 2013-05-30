Ext.define('o2e.dashboard.workspace.WidgetToolbar', {
    extend: 'Ext.toolbar.Toolbar',

    context: null,

    initComponent: function(cfg) {

        this.items = ['->',{
            text : 'Tile Windows',
            iconCls : 'icon-tile',
            handler: this.context.tileWindows,
            scope: this.context
        },{
            text : 'Cascade Windows',
            iconCls : 'icon-cascade',
            handler: this.context.cascadeWindows,
            scope: this.context
        }];

        this.callParent();
    }

});
