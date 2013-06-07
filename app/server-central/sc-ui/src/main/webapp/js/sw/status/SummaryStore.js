Ext.define('sw.status.SummaryStore', {
    extend: 'Ext.data.Store',
    model: 'sw.status.SummaryModel',
    proxy: {
        type: 'memory',
        reader: 'json'
    }
});