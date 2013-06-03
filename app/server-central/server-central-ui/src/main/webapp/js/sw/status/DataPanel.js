Ext.define('sw.status.DataPanel', {
    extend: 'Ext.tab.Panel',

    store: null,
    autoScroll: true,

    initComponent: function() {
        this.dockedItems = [{
            xtype: 'toolbar',
            position: 'bottom',
            items: [{
                text: 'Clear',
                handler: this.onClear,
                scope: this
            },'->',{
                text: 'Close',
                handler: this.onClose,
                scope: this
            }]
        }];
        this.items = this.buildItems();
        this.activeTab = 0;
        this.callParent(arguments);
        this.addEvents('clear', 'close');
    },

    buildItems: function() {
        return [Ext.create('Ext.grid.Panel', {
            title: 'Summary',
            store: this.summaryStore,
            border: 0,
            autoScroll: true,
            columns: [
                {text: "Name", menuDisabled: true, maxHeight: 18, flex: 1, dataIndex: 'service',
                    renderer: function(v, m, r) {
                        var f = r.get('filtered'), t = r.get('total');
                        return '<div class="'+r.get('statusCls')+'" style="float:left;width:16px;"></div>' +
                            ((f && f > 0) ? '<div class="icon-filter" style="float:left;width:16px;height:16px"></div>' : '') +
                            '<div class="sw-status-summary-item '+r.get('iconCls')+'">'+v+' ('+(t-f)+'/'+t+')</div>';
                    }
                }
            ],
            plugins: [{
                ptype: 'rowexpander',
                rowBodyTpl : [
                    '<p>Showing {[values.total-values.filtered]} of {total} records</p>',
                    '<p><b>Last Status Message:</b> {message}<br/>',
                    '<b>Last Error Message:</b> {lastError}</p>',
                    '<p>Status last updated on {timestamp}</p>'
                ]
            }]
        }),{
            title: 'Log',
            xtype: 'dataview',
            store: this.store,
            emptyText: 'No status messages received',
            itemSelector: 'div.sw-status-item',
            tpl: '<tpl for=".">' +
                '<div class="{statusCls}"/>' +
                '<div class="sw-status-item">' +
                  '<b>{service}</b>:&nbsp;{message}' +
                '</div>' +
            '</tpl>'
        }];
    },

    onClose: function() {
        this.fireEvent('close');
    },

    onClear: function() {
        this.fireEvent('clear');
    }
});