Ext.define('sw.status.SummaryModel', {
    extend: 'Ext.data.Model',
    fields: ['service', 'iconCls', 'statusCls', 'message', 'lastError', 'filtered', 'total', 'timestamp']
});