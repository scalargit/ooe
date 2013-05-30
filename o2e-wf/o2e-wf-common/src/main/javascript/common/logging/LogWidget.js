/**
 * @class o2e.logging.LogWidget
 * @extends Ext.grid.Panel
 *
 */
Ext.define('o2e.logging.LogWidget', {
    extend: 'Ext.grid.Panel',

    columns: [
        {
            header: 'Level',
            dataIndex: 'level',
            sortable: true,
            hideable: false,
            renderer: function(value) {
                return '<img src="'+o2e.log.LOG_LEVEL_ICONS[value]+'"/>';
            },
            width: 50
        },{
            header: 'Message',
            dataIndex: 'message',
            sortable: false,
            hideable: false,
            flex: 1
        },{
            header: 'Time',
            dataIndex: 'date',
            sortable: true,
            hideable: false,
            renderer: function(value) {
                return Ext.Date.format(value, "Y-m-d H:i:s");
            },
            width: 125
        }
    ],

    store: Ext.data.StoreManager.lookup('Logger'),

    preventHeader: true,

    getStateConfig: function() {
        return {
            type: 'logger'
        };
    }

}, function() {
    o2e.widget.WidgetFactory.reg('logger', this);
});