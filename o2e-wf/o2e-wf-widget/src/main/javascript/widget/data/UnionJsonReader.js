Ext.define('o2e.data.UnionJsonReader', {
    extend: 'Ext.data.reader.JsonFlattener',
    alias : 'reader.union',

    viewModel: null,

    setViewModel: function(model) {
        this.viewModel = model;
    }
});