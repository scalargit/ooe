Ext.define('sw.status.Store', {
    extend: 'Ext.data.Store',
    model: 'sw.status.Model',
    proxy: {
        type: 'memory',
        reader: 'json'
    }
});